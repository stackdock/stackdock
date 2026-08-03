"""Read-only Plex client for the /plex browse tab.

Talks to ONE Plex server (PLEX_URL) with PLEX_TOKEN. The token is a per-server
access token: for a server that's SHARED with the account (owned=False, which is
our case) the plain account token 401s — the working one comes from
plex.tv/api/v2/resources[].accessToken. scripts/plex_token.sh does that exchange.

Nothing is downloaded or mirrored: the tab lists what's on the server and links
out to Plex's own clients to play, so no media flows through the droplet (a 1 GB
box can't transcode) and no token reaches members' browsers. Images ARE proxied
through /plex/art so posters render without handing the token to the client.

Every call soft-fails: an unreachable server / expired share raises PlexError,
which the route renders as a message rather than a 500.
"""
import logging
import threading
import time
from urllib.parse import quote, urlencode

import requests

from . import config, db

log = logging.getLogger("stackdock.plex")

TIMEOUT = 15
_CACHE: dict[str, tuple[float, object]] = {}
CACHE_TTL = 120        # a library listing is cheap but the server is someone's home box
_REFRESH_LOCK = threading.Lock()


class PlexError(RuntimeError):
    pass


def _token() -> str:
    """The DB-stored token (written by the auto-refresher) wins over the .env
    seed — the container can't rewrite .env, so refreshed tokens live in SQLite."""
    return db.get_plex_token() or config.PLEX_TOKEN


def configured() -> bool:
    return bool(config.PLEX_URL and _token())


def _refresh_token() -> bool:
    """Mint a fresh PER-SERVER token via a plex.tv sign-in (PLEX_EMAIL/PASSWORD)
    and persist it. The password is only ever read from the environment and is
    never logged; only the derived token is stored. A shared (owned=False)
    server rejects plain account tokens, so the resources[].accessToken matching
    PLEX_SERVER_ID is the credential that actually works."""
    if not (config.PLEX_EMAIL and config.PLEX_PASSWORD and config.PLEX_SERVER_ID):
        return False
    with _REFRESH_LOCK:
        try:
            r = requests.post(
                "https://plex.tv/users/sign_in.json",
                headers={"X-Plex-Client-Identifier": "stackdock-server",
                         "X-Plex-Product": "Stackdock", "X-Plex-Version": "1.0",
                         "Accept": "application/json"},
                data={"user[login]": config.PLEX_EMAIL,
                      "user[password]": config.PLEX_PASSWORD},
                timeout=20)
            acct = ((r.json().get("user") or {}).get("authToken")
                    if r.status_code < 300 else None)
            if not acct:
                log.warning("Plex token refresh: plex.tv sign-in failed (HTTP %s)",
                            r.status_code)
                return False
            rr = requests.get(
                "https://plex.tv/api/v2/resources", params={"includeHttps": 1},
                headers={"X-Plex-Token": acct, "Accept": "application/json",
                         "X-Plex-Client-Identifier": "stackdock-server"},
                timeout=20)
            for res in (rr.json() if rr.status_code == 200 else []):
                if (res.get("clientIdentifier") == config.PLEX_SERVER_ID
                        and res.get("accessToken")):
                    db.set_plex_token(res["accessToken"])
                    log.info("Plex per-server token refreshed.")
                    return True
            log.warning("Plex token refresh: server not in this account's resources "
                        "(share revoked?)")
            return False
        except (requests.RequestException, ValueError) as e:
            log.warning("Plex token refresh failed: %s", e.__class__.__name__)
            return False


def _get(path: str, params: dict | None = None, cache: bool = True,
         _retried: bool = False):
    if not configured():
        raise PlexError("Plex isn't configured (PLEX_URL / PLEX_TOKEN).")
    key = path + "?" + urlencode(sorted((params or {}).items()))
    if cache:
        hit = _CACHE.get(key)
        if hit and time.time() - hit[0] < CACHE_TTL:
            return hit[1]
    url = config.PLEX_URL.rstrip("/") + path
    try:
        r = requests.get(url, params=params or {}, timeout=TIMEOUT,
                         headers={"X-Plex-Token": _token(),
                                  "Accept": "application/json"})
    except requests.RequestException as e:
        raise PlexError(f"couldn't reach the Plex server ({e.__class__.__name__})") from e
    if r.status_code == 401:
        # stale/expired token: mint a fresh one from the login creds and retry ONCE
        if not _retried and _refresh_token():
            return _get(path, params, cache=cache, _retried=True)
        raise PlexError("Plex rejected the token — the share may have been revoked; "
                        "re-run scripts/plex_token.sh or set PLEX_EMAIL/PLEX_PASSWORD")
    if r.status_code != 200:
        raise PlexError(f"Plex returned HTTP {r.status_code}")
    try:
        data = (r.json().get("MediaContainer") or {})
    except ValueError as e:
        raise PlexError("Plex returned a non-JSON response") from e
    if cache:
        _CACHE[key] = (time.time(), data)
    return data


def health() -> dict:
    """Soft status snapshot for /status — never raises."""
    out = {"configured": configured(), "ok": False, "server": None, "libraries": 0,
           "auto_refresh": bool(config.PLEX_EMAIL and config.PLEX_PASSWORD
                                and config.PLEX_SERVER_ID),
           "error": None}
    if not out["configured"]:
        return out
    try:
        libs = libraries()
        root = _get("/")
        out.update(ok=True, libraries=len(libs), server=root.get("friendlyName"))
    except PlexError as e:
        out["error"] = str(e)
    return out


def _item(m: dict) -> dict:
    """Normalize a Plex metadata dict to what the templates use."""
    sxe = None
    if m.get("type") == "episode" and m.get("parentIndex") is not None and m.get("index") is not None:
        sxe = f"S{int(m['parentIndex']):02d}E{int(m['index']):02d}"
    return {
        "key": m.get("ratingKey"),
        "title": m.get("title") or "(untitled)",
        "type": m.get("type"),
        "year": m.get("year"),
        "summary": m.get("summary") or "",
        "thumb": m.get("thumb") or m.get("parentThumb") or m.get("grandparentThumb"),
        # a season/episode shows its show name; a movie shows its year
        "spine": m.get("grandparentTitle") or m.get("parentTitle") or "",
        "sxe": sxe,
        "parent_key": m.get("parentRatingKey"),
        "duration_min": round(m["duration"] / 60000) if m.get("duration") else None,
        "leaf_count": m.get("leafCount"),
    }


def libraries() -> list[dict]:
    dirs = _get("/library/sections").get("Directory") or []
    return [{"key": d.get("key"), "title": d.get("title"), "type": d.get("type"),
             "thumb": d.get("thumb")} for d in dirs]


def recently_added(limit: int = 24) -> list[dict]:
    data = _get("/library/recentlyAdded", {"X-Plex-Container-Start": 0,
                                           "X-Plex-Container-Size": limit})
    return [_item(m) for m in (data.get("Metadata") or [])]


_SEARCH_TYPES = {"movie", "show", "season", "episode", "album", "artist", "track"}


def search(query: str, limit: int = 40) -> list[dict]:
    data = _get("/search", {"query": query[:80]}, cache=False)
    items = [_item(m) for m in (data.get("Metadata") or [])
             if m.get("type") in _SEARCH_TYPES]
    return items[:limit]


def browse(section_key: str, limit: int = 60, offset: int = 0,
           sort: str = "titleSort") -> tuple[dict, list[dict], int]:
    """(section, items, total) for one library section."""
    data = _get(f"/library/sections/{section_key}/all",
                {"X-Plex-Container-Start": offset, "X-Plex-Container-Size": limit,
                 "sort": sort})
    section = {"key": section_key, "title": data.get("title2") or data.get("librarySectionTitle") or "Library",
               "type": data.get("viewGroup")}
    return section, [_item(m) for m in (data.get("Metadata") or [])], int(data.get("totalSize") or 0)


def children(rating_key: str) -> tuple[dict, list[dict]]:
    """Seasons of a show, or episodes of a season."""
    data = _get(f"/library/metadata/{rating_key}/children")
    parent = {"title": data.get("title2") or data.get("parentTitle") or "",
              "key": rating_key}
    return parent, [_item(m) for m in (data.get("Metadata") or [])]


def art(thumb_path: str, width: int | None = None) -> tuple[bytes, str]:
    """Fetch a poster server-side so the token never reaches a member's browser.
    With `width`, Plex's photo transcoder downscales it first — full-size art is
    500 KB+ per poster and every byte passes through the droplet."""
    if not configured():
        raise PlexError("Plex isn't configured.")
    base = config.PLEX_URL.rstrip("/")
    if width:
        url = base + "/photo/:/transcode"
        params = {"width": width, "height": int(width * 1.5),
                  "minSize": 1, "upscale": 1, "url": thumb_path}
    else:
        url, params = base + thumb_path, {}
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT,
                         headers={"X-Plex-Token": _token()})
        if r.status_code == 401 and _refresh_token():
            r = requests.get(url, params=params, timeout=TIMEOUT,
                             headers={"X-Plex-Token": _token()})
        r.raise_for_status()
    except requests.RequestException as e:
        raise PlexError("couldn't fetch artwork") from e
    return r.content, r.headers.get("Content-Type", "image/jpeg")


def stream_info(rating_key: str) -> dict:
    """Item metadata + the codec/part details needed to pick a stream strategy."""
    data = _get(f"/library/metadata/{rating_key}", cache=False)
    md = (data.get("Metadata") or [{}])[0]
    if not md.get("ratingKey"):
        raise PlexError("item not found")
    item = _item(md)
    media = (md.get("Media") or [{}])[0]
    part = (media.get("Part") or [{}])[0]
    item.update(container=media.get("container"), video_codec=media.get("videoCodec"),
                audio_codec=media.get("audioCodec"), part_key=part.get("key"))
    item["direct"] = _direct_playable(item)   # else /plex/stream serves HLS
    return item


def neighbors(item: dict) -> tuple[dict | None, dict | None]:
    """(previous, next) episode within the same season, for the watch page's
    prev/next links and end-of-episode auto-advance. (None, None) for movies."""
    if item.get("type") != "episode" or not item.get("parent_key"):
        return None, None
    try:
        _, sibs = children(str(item["parent_key"]))
    except PlexError:
        return None, None
    keys = [s["key"] for s in sibs]
    try:
        idx = keys.index(item["key"])
    except ValueError:
        return None, None
    return (sibs[idx - 1] if idx > 0 else None,
            sibs[idx + 1] if idx + 1 < len(sibs) else None)


def _direct_playable(info: dict) -> bool:
    """Codecs every browser can play natively — anything else goes through
    Plex's live transcoder as HLS."""
    return (info.get("container") in ("mp4", "mov")
            and info.get("video_codec") == "h264"
            and info.get("audio_codec") in ("aac", "mp3", None))


def stream_url(rating_key: str, session: str) -> str:
    """A URL the member's <video> element can play. Direct file when the codecs
    are browser-native; otherwise Plex's universal transcoder emits HLS (the
    transcode runs on the PLEX server's hardware, not the droplet). The URL
    carries the per-server token — acceptable for a trusted member group; it is
    NOT the admin account token.  `session` must be unique per viewer+item or
    Plex kills the other viewer's transcode."""
    info = stream_info(rating_key)
    base = config.PLEX_URL.rstrip("/")
    if info["direct"] and info.get("part_key"):
        return f"{base}{info['part_key']}?X-Plex-Token={_token()}"
    q = urlencode({
        "path": f"/library/metadata/{rating_key}",
        "mediaIndex": 0, "partIndex": 0, "protocol": "hls",
        "fastSeek": 1, "directPlay": 0, "directStream": 1,
        "maxVideoBitrate": 8000, "videoQuality": 100,
        "X-Plex-Client-Identifier": "stackdock-web",
        # REQUIRED: without a platform the server can't pick a client profile
        # and 400s the transcode start (verified live, Aug 2026)
        "X-Plex-Platform": "Chrome",
        "X-Plex-Token": _token(),
        "session": session,
    })
    return f"{base}/video/:/transcode/universal/start.m3u8?{q}"


def web_url(rating_key: str) -> str:
    """Deep link into Plex's own player — playback happens in Plex, not here."""
    mid = config.PLEX_SERVER_ID or ""
    key = quote(f"/library/metadata/{rating_key}", safe="")
    return f"https://app.plex.tv/desktop/#!/server/{mid}/details?key={key}"
