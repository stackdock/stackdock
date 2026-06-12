"""Sync purchased audio files from your Gumroad library.

Gumroad has no buyer-side API, so this uses your logged-in session cookie
(the `_gumroad_app_session` cookie from your browser) to read your library
page and pull download links for audio files you've purchased.

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

from .. import config, db, notify, storage
from .podcast_rss import _download_to_storage, _slug

log = logging.getLogger("stackdock.gumroad")

LIBRARY_URL = "https://app.gumroad.com/library"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

AUDIO_EXTS = (".mp3", ".m4a", ".m4b", ".wav", ".aac", ".ogg", ".flac")


def _session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    s.cookies.set("_gumroad_app_session", config.GUMROAD_SESSION_COOKIE, domain=".gumroad.com")
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


def run() -> int:
    if not config.GUMROAD_SESSION_COOKIE:
        log.info("Gumroad cookie not configured; skipping.")
        return 0

    s = _session()
    r = s.get(LIBRARY_URL, timeout=60)
    if r.status_code != 200 or "library" not in r.url:
        log.warning("Gumroad library fetch failed (HTTP %s). Cookie likely expired — "
                    "grab a fresh _gumroad_app_session value from your browser.", r.status_code)
        return 0

    purchases = _extract_react_json(r.text)
    log.info("Gumroad: found %d purchases in library", len(purchases))

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
                    "Cookie": f"_gumroad_app_session={config.GUMROAD_SESSION_COOKIE}"
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
                notify.notify_episode(episode_id, feed_name, fname, storage.url_for(key))
    return new_count
