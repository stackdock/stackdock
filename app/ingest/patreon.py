"""Patreon ingest.

Patreon sits behind Cloudflare, which 403s plain HTTP clients regardless of IP —
so we fetch with curl_cffi using a Chrome TLS/UA fingerprint, which clears the
challenge (no headless browser needed). A member connects their patreon.com
`session_id` cookie (connected_accounts, service='patreon'). We pull their stream
(posts from creators they follow/back) and dedupe into the SAME merged pool as
Substack, keyed patreon:{post_id}: text posts -> articles, audio/podcast posts ->
episodes (audio streamed to R2). The creator's campaign name is the "publication".
is_paid + current_user_can_view drive the paid/locked flags. First sync per
account is a silent backfill (notified=1); later syncs notify via notify.flush().
"""
import io
import logging
import random
import threading
import time

from .. import config, db, notify, storage
from .substack import _clean_body

log = logging.getLogger("stackdock.patreon")

API = "https://www.patreon.com/api"
_RUN_LOCK = threading.Lock()

# fields kept small + explicit so Patreon doesn't 400 on unknown sparse fields
_POST_FIELDS = ("title,content,teaser_text,post_type,is_paid,current_user_can_view,"
                "published_at,url,patreon_url,post_file")


def _session(cookie: str):
    """curl_cffi session impersonating Chrome (TLS + UA) so Cloudflare lets us in.
    IMPORTANT: do NOT add extra headers (a Referer in particular makes Cloudflare
    403 the request) — the bare impersonated session matches a real browser; any
    override breaks the fingerprint consistency CF checks."""
    from curl_cffi import requests as cffi
    s = cffi.Session(impersonate="chrome", timeout=40)
    s.cookies.set("session_id", cookie, domain=".patreon.com")
    return s


def _get(s, url, params=None):
    try:
        r = s.get(url, params=params)
    except Exception as e:
        log.warning("Patreon GET error %s: %s", url, e)
        return None
    if r.status_code in (401, 403):
        return None   # stale cookie OR Cloudflare block — caller treats as auth failure
    if r.status_code != 200:
        log.warning("Patreon %s -> %s", url, r.status_code)
        return None
    try:
        return r.json()
    except ValueError:
        return None


def _authenticated(s) -> bool:
    return _get(s, f"{API}/current_user", {"fields[user]": "full_name"}) is not None


def fetch_stream(s, max_posts: int):
    """(posts, campaigns): posts is a list of JSON:API post dicts; campaigns maps
    campaign id -> name (from the `included` block). Cursor-paginated."""
    posts, campaigns = [], {}
    params = {
        "include": "campaign",
        "fields[campaign]": "name,url",
        "fields[post]": _POST_FIELDS,
        "page[count]": "20",
        "json-api-use-default-includes": "false",
    }
    cursor = None
    while len(posts) < max_posts:
        p = dict(params)
        if cursor:
            p["page[cursor]"] = cursor
        data = _get(s, f"{API}/stream", p)
        if not data:
            break
        for inc in data.get("included", []):
            if inc.get("type") == "campaign":
                campaigns[inc["id"]] = (inc.get("attributes") or {}).get("name")
        batch = data.get("data") or []
        if not batch:
            break
        posts.extend(batch)
        cursor = (((data.get("meta") or {}).get("pagination") or {})
                  .get("cursors") or {}).get("next")
        if not cursor:
            break
        time.sleep(random.uniform(0.8, 1.8))   # be polite to Patreon/Cloudflare
    return posts[:max_posts], campaigns


def _campaign_name(post, campaigns) -> str:
    rel = ((post.get("relationships") or {}).get("campaign") or {}).get("data") or {}
    return campaigns.get(rel.get("id")) or "Patreon"


def _audio_url(attrs):
    if (attrs.get("post_type") or "") not in ("audio_file", "podcast"):
        return None
    pf = attrs.get("post_file")
    return pf.get("url") if isinstance(pf, dict) else None


def _teaser_stub(url, teaser) -> str:
    t = (teaser or "").strip()
    head = f"<p>{t}</p>" if t else ""
    return head + f'<p class="stub"><a href="{url}">Read on Patreon →</a></p>'


def _thumb_url(a):
    """Best-effort poster image for a post (used as the article's cover thumbnail)."""
    pf = a.get("post_file") or {}
    cands = []
    dt = pf.get("default_thumbnail")
    if isinstance(dt, str):
        cands.append(dt)
    elif isinstance(dt, dict):
        cands.append(dt.get("url"))
    for k in ("thumbnail", "image"):
        v = a.get(k)
        if isinstance(v, dict):
            cands += [v.get("url"), v.get("large"), v.get("large_2")]
        elif isinstance(v, str):
            cands.append(v)
    return next((c for c in cands if isinstance(c, str) and c.startswith("http")), None)


def sync_account(account) -> tuple[int, str]:
    """Sync one Patreon account. Returns (new_count, status_message)."""
    s = _session(account["cookie"])
    if not _authenticated(s):
        return 0, "STALE: cookie rejected or Cloudflare-blocked — reconnect on the Accounts page"
    is_backfill = account["last_sync"] is None
    notified = 0 if not is_backfill else 1
    limit = config.PATREON_BACKFILL_POSTS if is_backfill else 60
    posts, campaigns = fetch_stream(s, limit)
    if not posts:
        return 0, "OK: no posts in feed"

    new = 0
    for post in posts:
        pid = post.get("id")
        if not pid:
            continue
        a = post.get("attributes") or {}
        guid = f"patreon:{pid}"
        title = a.get("title") or "(untitled)"
        pub = _campaign_name(post, campaigns)
        url = a.get("url") or a.get("patreon_url") or "https://www.patreon.com"
        is_paid = bool(a.get("is_paid"))
        can_view = bool(a.get("current_user_can_view"))
        published = a.get("published_at")
        audio = _audio_url(a)

        # ---- audio/podcast post -> episode (only when we can actually view it) ----
        if audio and can_view:
            if db.episode_exists(guid):
                db.set_episode_paid(guid, is_paid)
                continue
            try:
                resp = s.get(audio)
                if resp.status_code != 200 or not resp.content:
                    raise RuntimeError(f"audio HTTP {resp.status_code}")
                mime = resp.headers.get("content-type") or "audio/mpeg"
                key = f"patreon/{db.slugify(pub)}/{db.slugify(title)}.mp3"
                storage.upload_stream(io.BytesIO(resp.content), key, mime)
                eid = db.insert_episode(
                    guid=guid, feed_name=pub, title=title,
                    description=a.get("teaser_text") or "", audio_key=key,
                    audio_bytes=len(resp.content), audio_mime=mime, duration="",
                    published_at=published, image_url=None,
                    paid_access=1, is_paid=1 if is_paid else 0, notified=notified)
                if eid:
                    new += 1
                continue
            except Exception as e:
                log.warning("[%s] Patreon audio download failed (%s): %s",
                            account["label"], title, e)
                # fall through and store it as an article instead

        # ---- everything else (text / video / image / link) -> article ----
        # Patreon videos are expiring, Cloudflare-protected HLS streams that can't
        # be embedded, so a video post becomes an article whose body links out to
        # watch on Patreon (and whose card shows the poster thumbnail).
        is_video = (a.get("post_type") or "") == "video_external_file"
        thumb = _thumb_url(a)
        body = _clean_body(a.get("content")) if (can_view and a.get("content")) else ""
        if is_video:
            body = (f'<p class="stub">🎬 <a href="{url}">Watch this video on Patreon →</a></p>'
                    + body)
        if not (body or "").strip():
            body = _teaser_stub(url, a.get("teaser_text"))
        locked = is_paid and not can_view

        existing = db.get_article_by_message_id(guid)
        if existing:
            if existing["is_locked"] and can_view and a.get("content"):
                db.upgrade_article_body(existing["id"], _clean_body(a["content"]), account["label"])
            db.add_article_source(existing["id"], account["label"])
            continue
        aid = db.insert_article(
            message_id=guid, publication=pub, title=title, author=pub,
            original_url=url, html=body, published_at=published,
            added_by=account["label"], cover_image=thumb,
            is_paid=1 if is_paid else 0, is_locked=1 if locked else 0, notified=notified)
        if aid:
            db.add_article_source(aid, account["label"])
            new += 1
    return new, f"OK: {len(campaigns)} campaign(s), {new} new"


def run() -> int:
    """Sync every connected Patreon account; one resilient digest at the end."""
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("patreon sync already running; skipping overlapping run.")
        return 0
    try:
        accounts = db.list_accounts(service="patreon")
        if not accounts:
            return 0
        total = 0
        for account in accounts:
            try:
                count, status = sync_account(account)
                total += count
                db.update_account(account["id"],
                                  None if status.startswith("STALE") else db.now_iso(), status)
                log.info("[%s] %s", account["label"], status)
            except Exception as e:
                db.update_account(account["id"], None, f"Error: {e}")
                log.warning("Patreon sync failed for %s: %s", account["label"], e)
        notify.flush()
        return total
    finally:
        _RUN_LOCK.release()
