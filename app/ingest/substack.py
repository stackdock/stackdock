"""Sync Substack subscriptions directly via each member's session cookie.

Each user connects their own Substack account by pasting the value of the
`substack.sid` cookie (from a logged-in browser at substack.com). For every
connected account we:

  1. Fetch the account's subscription list   (substack.com/api/v1/subscriptions)
  2. For each publication, page through its archive
                                              ({pub}/api/v1/archive?sort=new&offset=N)
  3. For each post we haven't stored yet, fetch the full body
                                              ({pub}/api/v1/posts/{slug})

Paid posts return full body_html when the cookie's account is a paying
subscriber. When a body isn't accessible (e.g. publication on a custom domain
where the substack.com cookie doesn't apply, or a preview-only post) we still
store the post as a LINK entry — title, date, and a link to the original — so
the unified page lists everything.

The first sync of an account is a BACKFILL (up to SUBSTACK_BACKFILL_POSTS per
publication) and does not send Discord notifications; later syncs notify
normally. These endpoints are unofficial; if Substack changes them, the JSON
walking below is written defensively and is the place to fix.
"""
import logging
import threading
import random
import time
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from .. import config, db, notify, storage
from .podcast_rss import _download_to_storage, _slug

log = logging.getLogger("stackdock.substack")

# Rotate a realistic desktop UA per session (a real browser keeps ONE UA for a
# session, so we pick once at session creation rather than per request).
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
]
PAGE_SIZE = 25
# Jittered pacing so requests aren't perfectly periodic (that pattern is bot-like).
REQUEST_GAP_MIN, REQUEST_GAP_MAX = 0.8, 2.2
MAX_RETRIES = 4            # on 429/503
BACKOFF_CAP_S = 90

# Substack auto-subscribes every account to its own promo blog ("The Substack
# Post", post.substack.com). It's noise — never ingest it.
SKIP_SUBDOMAINS = {"post"}


def _session(cookie: str) -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    s.cookies.set("substack.sid", cookie, domain=".substack.com")
    return s


def polite_get(s: requests.Session, url: str, **kwargs) -> requests.Response:
    """GET with jittered pacing + exponential backoff on rate limits (429/503).
    Honours Retry-After when present. Returns the last response either way."""
    kwargs.setdefault("timeout", 30)
    r = None
    for attempt in range(MAX_RETRIES):
        time.sleep(random.uniform(REQUEST_GAP_MIN, REQUEST_GAP_MAX))
        r = s.get(url, **kwargs)
        if r.status_code not in (429, 503):
            return r
        ra = r.headers.get("Retry-After", "")
        wait = (int(ra) if ra.isdigit() else min(BACKOFF_CAP_S, 5 * 2 ** attempt))
        wait += random.uniform(0, 3)
        log.warning("rate limited (%s) on %s — backing off %.1fs (try %d/%d)",
                    r.status_code, url, wait, attempt + 1, MAX_RETRIES)
        time.sleep(wait)
    return r


def _get_json(s: requests.Session, url: str, params=None):
    r = polite_get(s, url, params=params)
    if r is None or r.status_code != 200:
        return None
    try:
        return r.json()
    except ValueError:
        return None


def _post_by_id(s: requests.Session, post_id) -> dict | None:
    """Full post JSON via substack.com's cross-domain reader endpoint. The
    substack.com cookie ALWAYS applies here, so this returns full body_html and
    the full (paid) podcast_url for pubs the account actually pays for — even on
    custom domains, where {custom}/api/v1/posts/{slug} would only give a preview."""
    data = _get_json(s, f"https://substack.com/api/v1/posts/by-id/{post_id}")
    if isinstance(data, dict):
        return data.get("post", data)
    return None


_PAYWALL_MARKERS = ("paywall-jump", "paywalltodom", 'class="paywall')


def _is_locked(post: dict) -> bool:
    """For a paid post, Substack injects a paywall-jump marker into body_html
    ONLY when the account can read past the paywall (full access). A no-access
    preview is just the truncated teaser and omits the marker entirely. (Length
    ratios are unreliable — some previews run several paragraphs.)"""
    bh = (post.get("body_html") or "").lower()
    if not bh:
        return True
    return not any(m in bh for m in _PAYWALL_MARKERS)


def _effective_base(s: requests.Session, sub: str | None, custom: str | None) -> str:
    """Custom-domain pubs publish from their own domain; their {sub}.substack.com
    archive is empty. Follow the subdomain's redirect to find the real host."""
    if custom:
        return f"https://{custom}"
    base = f"https://{sub}.substack.com"
    try:
        r = polite_get(s, base, timeout=15, allow_redirects=True)
        host = urlparse(r.url).netloc
        if host and host != f"{sub}.substack.com":
            return f"https://{host}"
    except requests.RequestException:
        pass
    return base


class SubscriptionsApiError(RuntimeError):
    """The subscriptions endpoint rejected every request shape we know."""


# Substack changes what api/v1/subscriptions expects (June 2026: it started
# requiring ?tvOnly=false, returning 400 otherwise — which previously looked
# like "no subscriptions"). Shapes are tried in order; when Substack breaks
# this again, capture the 400 body (it names the param) and add a shape here.
SUBSCRIPTION_REQUESTS = [
    ("https://substack.com/api/v1/subscriptions", {"tvOnly": "false"}),
    ("https://substack.com/api/v1/subscriptions", None),
    ("https://substack.com/api/v1/reader/subscriptions", None),
]


def _self_handle(s: requests.Session) -> str | None:
    """The logged-in account's own Substack handle (drives public-profile discovery)."""
    data = _get_json(s, "https://substack.com/api/v1/user/profile/self")
    return data.get("handle") if isinstance(data, dict) else None


def get_publications_via_profile(s: requests.Session, handle: str) -> list[dict]:
    """Discovery fallback used by the community substack-api library: the PUBLIC
    profile endpoint lists a user's subscriptions with no auth at all.
    Requires the member's reading list to be visible on their profile."""
    data = _get_json(s, f"https://substack.com/api/v1/user/{handle}/public_profile")
    if not isinstance(data, dict):
        return []
    pubs, seen = [], set()
    for sub in data.get("subscriptions") or []:
        pub = (sub or {}).get("publication") or {}
        name, subdomain, custom = pub.get("name"), pub.get("subdomain"), pub.get("custom_domain")
        if not name or not (subdomain or custom) or subdomain in SKIP_SUBDOMAINS:
            continue
        key = custom or subdomain
        if key not in seen:
            seen.add(key)
            # membership_state: "free_signup" = free; "subscribed"/"comped"/
            # "founding"/etc = paying. Anything that isn't a free signup is treated
            # as paid access — the reliable signal for whether this account gets the
            # FULL paid podcast audio (the post text paywall marker is no signal).
            ms = (sub or {}).get("membership_state")
            pubs.append({"name": name, "base_url": _effective_base(s, subdomain, custom),
                         "paid": bool(ms) and ms != "free_signup"})
    return pubs


def get_publications(s: requests.Session) -> list[dict] | None:
    """Return [{'name':..., 'base_url':...}] for everything the account subscribes to.

    Returns None when the cookie is stale (auth rejected), [] when the account
    simply has no subscriptions. Raises SubscriptionsApiError when the endpoint
    rejects every known request shape, with Substack's own error message so it
    shows up verbatim in the account status on /accounts.
    """
    data, failures = None, []
    for url, params in SUBSCRIPTION_REQUESTS:
        r = polite_get(s, url, params=params)
        if r.status_code in (401, 403):
            return None  # stale/invalid cookie
        if r.status_code == 200:
            try:
                data = r.json()
                break
            except ValueError:
                failures.append(f"{url} -> 200 but not JSON")
                continue
        failures.append(f"{url}{'?' + str(params) if params else ''} -> "
                        f"HTTP {r.status_code}: {r.text[:200]}")
    if data is None:
        raise SubscriptionsApiError(
            "subscriptions endpoint rejected all known request shapes — "
            + " | ".join(failures))

    raw, seen = [], set()

    def consider(node: dict):
        sub = node.get("subdomain")
        custom = node.get("custom_domain")
        name = node.get("name")
        if not name or not (sub or custom):
            return
        if sub in SKIP_SUBDOMAINS:
            return
        key = custom or sub
        if key not in seen:
            seen.add(key)
            raw.append((name, sub, custom))

    def walk(node):
        if isinstance(node, dict):
            consider(node)
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for x in node:
                walk(x)

    walk(data)

    # resolve each pub's real host (custom domains publish off their own domain)
    pubs = [{"name": name, "base_url": _effective_base(s, sub, custom)}
            for name, sub, custom in raw]
    # add manually-listed pubs the subscriptions API omits (some paid / podcast subs)
    have = {p["base_url"] for p in pubs}
    for extra in config.SUBSTACK_EXTRA_PUBS:
        base = (extra.get("base_url") or "").rstrip("/")
        if base and base not in have:
            pubs.append({"name": extra.get("name") or base, "base_url": base})
    return pubs


def fetch_archive(s: requests.Session, base_url: str, max_posts: int) -> list[dict]:
    posts, offset = [], 0
    while len(posts) < max_posts:
        batch = _get_json(s, f"{base_url}/api/v1/archive",
                          params={"sort": "new", "offset": offset, "limit": PAGE_SIZE})
        if not isinstance(batch, list) or not batch:
            break
        posts.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += len(batch)
    return posts[:max_posts]


def fetch_body(s: requests.Session, base_url: str, slug: str) -> str | None:
    data = _get_json(s, f"{base_url}/api/v1/posts/{slug}")
    if isinstance(data, dict):
        return data.get("body_html") or None
    return None


_SUBSCRIBE_SELECTORS = (
    ".subscription-widget-wrap", ".subscription-widget", ".subscribe-widget",
    ".subscribe-dialog", ".subscription-widget-wrap-editor",
)


def _clean_body(html: str | None) -> str | None:
    """Strip Substack's injected subscribe widgets — the 'X is a reader-supported
    publication… become a free or paid subscriber' CTA and the email box under it
    (which looks like a search bar)."""
    if not html:
        return html
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return html
    changed = False
    for sel in _SUBSCRIBE_SELECTORS:
        for el in soup.select(sel):
            el.decompose()
            changed = True
    # fallback: any stray CTA paragraph the widget classes missed
    for el in soup.find_all(["p", "div"]):
        txt = el.get_text(" ", strip=True).lower()
        if "reader-supported publication" in txt and "subscriber" in txt:
            el.decompose()
            changed = True
    return str(soup) if changed else html


def _stub_html(url: str) -> str:
    return (f'<p class="stub">Full text couldn\'t be mirrored for this post. '
            f'<a href="{url}" rel="noopener">Read it on the original site →</a></p>')


def sync_account(account) -> tuple[int, str, list[dict]]:
    """Sync one connected account. Returns (new_articles, status_message, notify_items)."""
    s = _session(account["cookie"])
    manual = [{"name": m["name"], "base_url": m["base_url"]}
              for m in db.list_tracked_publications(user_id=account["user_id"])]
    try:
        pubs = get_publications(s)   # cookie subscriptions endpoint — only a partial set
    except SubscriptionsApiError as e:
        log.warning("[%s] subscriptions API unavailable: %s", account["label"], e)
        pubs = []
    if pubs is None:
        return 0, "STALE: cookie expired or invalid — reconnect on the Accounts page", []

    # The subscriptions API returns only a curated handful; the member's public
    # profile lists EVERY subscription (free + paid). Auto-detect the handle and
    # always merge the full list in.
    handle = account["handle"] or _self_handle(s)
    if handle and not account["handle"]:
        db.set_account_handle(account["id"], handle)
    have = {p["base_url"] for p in pubs}
    paid_map = {}
    if handle:
        for p in get_publications_via_profile(s, handle):
            paid_map[p["base_url"]] = p.get("paid", False)
            if p["base_url"] not in have:
                have.add(p["base_url"]); pubs.append(p)
        log.info("[%s] discovery: %d publications (profile=%s)", account["label"], len(pubs), handle)

    pubs += [m for m in manual if m["base_url"] not in have]
    # stamp paid-subscription status (from the public-profile membership) on every
    # pub, so the podcast path knows whether THIS account gets full paid audio
    for p in pubs:
        p["paid"] = paid_map.get(p["base_url"], p.get("paid", False))
    if not pubs:
        return 0, "OK: no subscriptions found on this account", []

    is_backfill = account["last_sync"] is None
    new_count, mirrored, link_only, episodes = 0, 0, 0, 0
    items: list[dict] = []  # collected for the unified digest (one push per run)

    for pub in pubs:
        archive = fetch_archive(s, pub["base_url"], config.SUBSTACK_BACKFILL_POSTS)
        log.info("[%s] %s: %d posts in archive window", account["label"], pub["name"], len(archive))
        for post in archive:
            post_id = post.get("id")
            slug = post.get("slug")
            if not post_id or not slug:
                continue
            guid = f"substack:{post_id}"
            url = post.get("canonical_url") or f"{pub['base_url']}/p/{slug}"
            title = post.get("title") or "(untitled)"

            # ---- podcast episodes: pull the audio via the cookie ----
            # A paid show served to a NON-paying subscriber yields a short preview
            # podcast_url; a paying subscriber gets the full episode. So audio access
            # tracks paid-SUBSCRIPTION status (pub["paid"], from the public-profile
            # membership) — NOT the post text paywall (a podcast body is just show
            # notes). Dedupe by post id; a paying account upgrades a stored preview
            # to full audio in place (replacing the old R2 object). is_paid (green
            # chip) is the audience flag and is refreshed cheaply for existing rows.
            if post.get("type") == "podcast":
                is_paid = post.get("audience") == "only_paid"
                account_pays = bool(pub.get("paid"))
                existing_ep = db.get_episode_by_guid(guid)
                if existing_ep:
                    db.set_episode_paid(guid, is_paid)   # keep green flag current (cheap)
                    if existing_ep["paid_access"] or not account_pays:
                        continue   # already full, or this account can't get a better version
                    # else: we hold a preview AND this account pays -> upgrade below
                full = _post_by_id(s, post_id) or {}
                audio_url = full.get("podcast_url") or post.get("podcast_url")
                if not audio_url:
                    continue
                ext = audio_url.split("?")[0].rsplit(".", 1)
                ext = ext[1].lower() if len(ext) == 2 and len(ext[1]) <= 4 else "mp3"
                key = f"podcasts/{_slug(pub['name'])}/{_slug(title)}.{ext}"
                dl_headers = {"Cookie": f"substack.sid={account['cookie']}",
                              "User-Agent": s.headers["User-Agent"]}
                size = mime = None
                for attempt in range(MAX_RETRIES):
                    try:
                        size, mime = _download_to_storage(audio_url, key, headers=dl_headers)
                        break
                    except requests.HTTPError as e:
                        code = getattr(e.response, "status_code", None)
                        if code in (429, 503) and attempt < MAX_RETRIES - 1:
                            wait = min(BACKOFF_CAP_S, 5 * 2 ** attempt) + random.uniform(0, 3)
                            log.warning("Podcast download rate-limited (%s) %s — backoff %.1fs",
                                        code, title, wait)
                            time.sleep(wait)
                            continue
                        log.warning("Podcast download failed (%s): %s", title, e)
                        break
                    except Exception as e:
                        log.warning("Podcast download failed (%s): %s", title, e)
                        break
                if mime is None:   # all attempts failed (size can legitimately be 0)
                    continue
                dur = full.get("podcast_duration") or post.get("podcast_duration")
                ep_image = (full.get("podcast_episode_image_url")
                            or post.get("podcast_episode_image_url") or post.get("cover_image"))
                if existing_ep:
                    # paying subscriber replaces the stored preview with full audio
                    db.upgrade_episode(
                        guid, audio_key=key, audio_bytes=size, audio_mime=mime,
                        duration=str(round(dur)) if dur else "",
                        image_url=ep_image, paid_access=1, is_paid=1 if is_paid else 0)
                    old_key = existing_ep["audio_key"]
                    if old_key and old_key != key:
                        try:
                            storage.delete(old_key)
                        except Exception as e:
                            log.warning("Could not delete old preview audio %s: %s", old_key, e)
                    log.info("[%s] upgraded podcast to full paid audio: %s",
                             account["label"], title)
                    episodes += 1
                    continue   # an upgrade is not a NEW item — don't re-notify
                episode_id = db.insert_episode(
                    guid=guid, feed_name=pub["name"], title=title,
                    description=full.get("subtitle") or "",
                    audio_key=key, audio_bytes=size, audio_mime=mime,
                    duration=str(round(dur)) if dur else "",
                    published_at=post.get("post_date"),
                    image_url=ep_image,
                    paid_access=1 if account_pays else 0,   # full only when this account pays
                    is_paid=1 if is_paid else 0,
                    notified=0 if not is_backfill else 1,   # backfill is silent
                )
                if episode_id:
                    new_count += 1
                    episodes += 1
                    if not is_backfill:
                        items.append({"type": "episode", "source": pub["name"], "title": title,
                                      "url": f"{config.PUBLIC_BASE_URL}/listen/{db.get_episode(episode_id)['slug']}",
                                      "original_url": url, "published_at": post.get("post_date")})
                continue

            # ---- text articles (full body if accessible, preview/link otherwise) ----
            # Content is deduped across members. If we already have this post,
            # just credit this account too — and if ours is a locked preview but
            # this account can read the full post, upgrade it in place.
            is_paid = post.get("audience") == "only_paid"
            # Same post may already exist from ANY source: this guid, an email
            # ingest (different message_id), or an anonymous tracked-pub sync.
            existing = (db.get_article_by_message_id(guid)
                        or db.find_article_match(url, pub["name"], title))
            if existing:
                # body needs upgrading if it's a locked preview, an empty/stub
                # link-only row, and this account might have full access
                needs_body = bool(existing["is_locked"] or not existing["html"]
                                  or 'class="stub"' in (existing["html"] or ""))
                new_body = None
                if needs_body:
                    full = _post_by_id(s, post_id)
                    if full and full.get("body_html") and not _is_locked(full):
                        new_body = _clean_body(full["body_html"])
                        log.info("[%s] upgraded existing post to full body: %s",
                                 account["label"], title)
                db.absorb_article(
                    existing["id"], message_id=guid, html=new_body,
                    cover_image=post.get("cover_image"),
                    author=(post.get("publishedBylines") or [{}])[0].get("name"),
                    published_at=post.get("post_date"), original_url=url,
                    is_paid=is_paid, source_label=account["label"])
                continue

            full = _post_by_id(s, post_id)
            body = _clean_body((full or {}).get("body_html"))
            locked = bool(is_paid and (_is_locked(full) if full else True))
            if body:
                mirrored += 1
            else:
                link_only += 1
                body = _stub_html(url)

            article_id = db.insert_article(
                message_id=guid,
                publication=pub["name"],
                title=title,
                author=(post.get("publishedBylines") or [{}])[0].get("name") or pub["name"],
                original_url=url,
                html=body,
                published_at=post.get("post_date"),
                added_by=account["label"],
                cover_image=post.get("cover_image"),
                is_paid=is_paid,
                is_locked=locked,
                notified=0 if not is_backfill else 1,   # backfill is silent
            )
            if article_id:
                db.add_article_source(article_id, account["label"])
                new_count += 1
                if not is_backfill:
                    items.append({
                        "type": "article",
                        "source": pub["name"],
                        "title": title,
                        "url": f"{config.PUBLIC_BASE_URL}/read/{db.get_article(article_id)['slug']}",
                        "original_url": url,
                        "published_at": post.get("post_date"),
                    })

    status = (f"OK: {len(pubs)} publications, {new_count} new "
              f"({mirrored} mirrored, {link_only} link-only, {episodes} episodes)")
    return new_count, status, items


def sync_orphan_tracked_pubs(covered_user_ids: set[int]) -> int:
    """Tracked publications whose owner has no connected account still sync
    anonymously: full archive listing + free post bodies; paid posts go link-only."""
    orphans = [m for m in db.list_tracked_publications()
               if m["user_id"] not in covered_user_ids]
    if not orphans:
        return 0
    s = requests.Session()
    s.headers.update({"User-Agent": random.choice(USER_AGENTS),
                      "Accept-Language": "en-US,en;q=0.9"})
    new_count = 0
    for m in orphans:
        archive = fetch_archive(s, m["base_url"], config.SUBSTACK_BACKFILL_POSTS)
        for post in archive:
            post_id, slug = post.get("id"), post.get("slug")
            if not post_id or not slug or post.get("type") == "podcast"                     or db.article_exists(f"substack:{post_id}"):
                continue
            url = post.get("canonical_url") or f"{m['base_url']}/p/{slug}"
            body = fetch_body(s, m["base_url"], slug) or _stub_html(url)
            is_paid = post.get("audience") == "only_paid"
            if db.insert_article(
                    message_id=f"substack:{post_id}", publication=m["name"],
                    title=post.get("title") or "(untitled)",
                    author=(post.get("publishedBylines") or [{}])[0].get("name") or m["name"],
                    original_url=url, html=body, published_at=post.get("post_date"),
                    added_by=f"tracked:{m['name']}", cover_image=post.get("cover_image"),
                    is_paid=is_paid, is_locked=is_paid, notified=1):  # silent backfill
                new_count += 1
    return new_count  # silent (treated like backfill); digest covers account syncs


_RUN_LOCK = threading.Lock()


def run() -> int:
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("%s sync already running; skipping overlapping run.", __name__)
        return 0
    try:
        return _run()
    finally:
        _RUN_LOCK.release()


def _run() -> int:
    """Sync every connected account + manually tracked publications."""
    accounts = db.list_accounts(service='substack')
    if not accounts and not db.list_tracked_publications():
        log.info("No Substack accounts or tracked publications; skipping.")
        return 0

    total, all_items = 0, []
    for account in accounts:
        try:
            count, status, items = sync_account(account)
            total += count
            all_items.extend(items)
            notify.alert_if_stale(account, status, "substack", db.get_user, db.set_account_alert)
            # a STALE result keeps last_sync unchanged so the next fix triggers a fresh backfill check
            db.update_account(account["id"],
                              None if status.startswith("STALE") else db.now_iso(),
                              status)
            log.info("[%s] %s", account["label"], status)
        except Exception as e:
            db.update_account(account["id"], None, f"Error: {e}")
            log.warning("Sync failed for %s: %s", account["label"], e)
    covered = {a["user_id"] for a in accounts}
    try:
        total += sync_orphan_tracked_pubs(covered)
    except Exception as e:
        log.warning("Tracked-publication sync failed: %s", e)
    # ONE unified, resilient digest for everything not yet announced (this run's
    # new items + any orphaned by a prior interrupted run)
    notify.flush()
    return total
