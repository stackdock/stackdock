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
import time

import requests

from .. import config, db, notify

log = logging.getLogger("stackdock.substack")

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
PAGE_SIZE = 25
REQUEST_GAP_S = 0.6  # be polite; don't hammer the API


def _session(cookie: str) -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    s.cookies.set("substack.sid", cookie, domain=".substack.com")
    return s


def _get_json(s: requests.Session, url: str, params=None):
    time.sleep(REQUEST_GAP_S)
    r = s.get(url, params=params, timeout=30)
    if r.status_code != 200:
        return None
    try:
        return r.json()
    except ValueError:
        return None


def get_publications(s: requests.Session) -> list[dict] | None:
    """Return [{'name':..., 'base_url':...}] for everything the account subscribes to.

    Returns None when the cookie is stale (auth rejected), [] when the account
    simply has no subscriptions.
    """
    time.sleep(REQUEST_GAP_S)
    # Substack now requires the tvOnly query param on this endpoint; without it
    # the API returns 400 (which used to look like "no subscriptions").
    r = s.get("https://substack.com/api/v1/subscriptions",
              params={"tvOnly": "false"}, timeout=30)
    if r.status_code in (401, 403):
        return None  # stale/invalid cookie
    if r.status_code != 200:
        return []
    try:
        data = r.json()
    except ValueError:
        return []

    pubs, seen = [], set()

    def consider(node: dict):
        sub = node.get("subdomain")
        custom = node.get("custom_domain")
        name = node.get("name")
        if not name or not (sub or custom):
            return
        base = f"https://{custom}" if custom else f"https://{sub}.substack.com"
        if base not in seen:
            seen.add(base)
            pubs.append({"name": name, "base_url": base})

    def walk(node):
        if isinstance(node, dict):
            consider(node)
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for x in node:
                walk(x)

    walk(data)
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


def _stub_html(url: str) -> str:
    return (f'<p class="stub">Full text couldn\'t be mirrored for this post. '
            f'<a href="{url}" rel="noopener">Read it on the original site →</a></p>')


def sync_account(account) -> tuple[int, str, list[dict]]:
    """Sync one connected account. Returns (new_articles, status_message, notify_items)."""
    s = _session(account["cookie"])
    pubs = get_publications(s)
    if pubs is None:
        return 0, "STALE: cookie expired or invalid — reconnect on the Accounts page", []
    if not pubs:
        return 0, "OK: no subscriptions found on this account", []

    is_backfill = account["last_sync"] is None
    new_count, mirrored, link_only = 0, 0, 0
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
            if db.article_exists(guid):
                continue

            url = post.get("canonical_url") or f"{pub['base_url']}/p/{slug}"
            body = fetch_body(s, pub["base_url"], slug)
            if body:
                mirrored += 1
            else:
                link_only += 1
                body = _stub_html(url)

            article_id = db.insert_article(
                message_id=guid,
                publication=pub["name"],
                title=post.get("title") or "(untitled)",
                author=(post.get("publishedBylines") or [{}])[0].get("name") or pub["name"],
                original_url=url,
                html=body,
                published_at=post.get("post_date"),
                added_by=account["label"],
                cover_image=post.get("cover_image"),
            )
            if article_id:
                new_count += 1
                if not is_backfill:
                    items.append({
                        "type": "article",
                        "source": pub["name"],
                        "title": post.get("title") or "(untitled)",
                        "url": f"{config.PUBLIC_BASE_URL}/read/{db.get_article(article_id)['slug']}",
                        "original_url": url,
                        "published_at": post.get("post_date"),
                    })

    status = f"OK: {len(pubs)} publications, {new_count} new ({mirrored} mirrored, {link_only} link-only)"
    return new_count, status, items


def run() -> int:
    """Sync every connected account. Returns total new articles."""
    accounts = db.list_accounts(service='substack')
    if not accounts:
        log.info("No Substack accounts connected; skipping.")
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
    # ONE unified push for everything new across every member's subscriptions
    notify.push_new_items(all_items)
    return total
