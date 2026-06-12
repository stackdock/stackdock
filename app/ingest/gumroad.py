"""Sync purchased audio files from members' Gumroad libraries.

Gumroad has no buyer-side API, so each member connects their account on the
/accounts page by pasting their `_gumroad_app_session` cookie. We read each
library page and pull download links for purchased audio files. The first
sync per account is a silent backfill (no Discord notifications).

NOTE: Gumroad's frontend changes from time to time. The library page embeds
its data as JSON in a `script[data-component-name="LibraryPage"]` (or similar
React props attribute). If this parser stops finding purchases, open
https://app.gumroad.com/library in your browser, view source, and check what
the JSON blob is attached to — the fix is usually a one-line selector change.

Prefer the RSS route when available: if a creator enabled "podcast" mode on
a product, grab the RSS URL from the product's content page and put it in
PODCAST_FEEDS instead — that path is far more stable.
"""
import json
import logging
import re

import requests
from bs4 import BeautifulSoup

from .. import db, notify, storage
from .podcast_rss import _download_to_storage, _slug

log = logging.getLogger("stackdock.gumroad")

LIBRARY_URL = "https://app.gumroad.com/library"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

AUDIO_EXTS = (".mp3", ".m4a", ".m4b", ".wav", ".aac", ".ogg", ".flac")


def _session(cookie: str) -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    s.cookies.set("_gumroad_app_session", cookie, domain=".gumroad.com")
    return s


def _extract_react_json(html: str) -> list[dict]:
    """Find JSON props blobs embedded in the page and return any 'purchases'/'results' lists."""
    soup = BeautifulSoup(html, "lxml")
    blobs = []
    for tag in soup.find_all(attrs={"data-react-props": True}):
        try:
            blobs.append(json.loads(tag["data-react-props"]))
        except json.JSONDecodeError:
            pass
    for tag in soup.find_all("script", type="application/json"):
        try:
            blobs.append(json.loads(tag.string or ""))
        except (json.JSONDecodeError, TypeError):
            pass

    purchases = []
    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in ("purchases", "results", "library") and isinstance(v, list):
                    purchases.extend(x for x in v if isinstance(x, dict))
                walk(v)
        elif isinstance(node, list):
            for x in node:
                walk(x)
    for b in blobs:
        walk(b)
    return purchases


def _find_file_urls(s: requests.Session, purchase: dict) -> list[tuple[str, str, str]]:
    """Return (file_id, display_name, url) for audio files on a purchase's content page."""
    content_url = (
        purchase.get("download_url")
        or purchase.get("content_url")
        or (purchase.get("product") or {}).get("download_url")
    )
    if not content_url:
        return []
    if content_url.startswith("/"):
        content_url = "https://app.gumroad.com" + content_url

    r = s.get(content_url, timeout=60)
    if r.status_code != 200:
        log.warning("Could not open content page (%s): HTTP %s", content_url, r.status_code)
        return []

    files = []
    # Direct file links in the page
    soup = BeautifulSoup(r.text, "lxml")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if any(href.lower().split("?")[0].endswith(ext) for ext in AUDIO_EXTS) or "/r/" in href:
            name = a.get_text(strip=True) or href.rsplit("/", 1)[-1]
            files.append((href, name, href if href.startswith("http") else "https://app.gumroad.com" + href))

    # Files described in embedded JSON (newer UI)
    for m in re.finditer(r'"download_url"\s*:\s*"([^"]+)"', r.text):
        url = m.group(1).replace("\\u0026", "&")
        if url.startswith("/"):
            url = "https://app.gumroad.com" + url
        files.append((url, url.rsplit("/", 1)[-1], url))

    # Dedupe by URL
    seen, out = set(), []
    for fid, name, url in files:
        if url not in seen:
            seen.add(url)
            out.append((fid, name, url))
    return out


def sync_account(account) -> tuple[int, str]:
    """Sync one connected Gumroad account. Returns (new_episodes, status_message)."""
    s = _session(account["cookie"])
    r = s.get(LIBRARY_URL, timeout=60)
    if r.status_code != 200 or "library" not in r.url:
        return 0, ("Cookie invalid/expired (HTTP %s) — reconnect with a fresh "
                   "_gumroad_app_session value" % r.status_code)

    purchases = _extract_react_json(r.text)
    log.info("[%s] Gumroad: %d purchases in library", account["label"], len(purchases))

    is_backfill = account["last_sync"] is None
    new_count = 0
    for p in purchases:
        product_name = (
            p.get("name")
            or (p.get("product") or {}).get("name")
            or "Gumroad purchase"
        )
        feed_name = f"Gumroad: {product_name}"
        for fid, fname, url in _find_file_urls(s, p):
            guid = f"gumroad:{url}"
            if db.episode_exists(guid):
                continue

            ext = url.split("?")[0].rsplit(".", 1)
            ext = ext[1].lower() if len(ext) == 2 and len(ext[1]) <= 4 else "mp3"
            key = f"podcasts/{_slug(feed_name)}/{_slug(fname)}.{ext}"
            try:
                log.info("Downloading Gumroad file: [%s] %s", product_name, fname)
                size, mime = _download_to_storage(url, key, headers=dict(s.headers) | {
                    "Cookie": f"_gumroad_app_session={account['cookie']}"
                })
                if not mime.startswith("audio"):
                    # Skip PDFs/zips etc. — this tool only mirrors audio
                    continue
            except Exception as e:
                log.warning("Gumroad download failed (%s): %s", fname, e)
                continue

            episode_id = db.insert_episode(
                guid=guid, feed_name=feed_name, title=fname, description="",
                audio_key=key, audio_bytes=size, audio_mime=mime,
                duration="", published_at="",
            )
            if episode_id:
                new_count += 1
                if not is_backfill:
                    notify.notify_episode(episode_id, feed_name, fname, storage.url_for(key))

    return new_count, f"OK: {len(purchases)} purchases, {new_count} new episode(s)"


def run() -> int:
    """Sync every connected Gumroad account. Returns total new episodes."""
    accounts = db.list_accounts(service="gumroad")
    if not accounts:
        log.info("No Gumroad accounts connected; skipping.")
        return 0

    total = 0
    for account in accounts:
        try:
            count, status = sync_account(account)
            total += count
            db.update_account(account["id"], db.now_iso(), status)
            log.info("[%s] %s", account["label"], status)
        except Exception as e:
            db.update_account(account["id"], None, f"Error: {e}")
            log.warning("Gumroad sync failed for %s: %s", account["label"], e)
    return total
