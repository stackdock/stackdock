"""Member radio: submit a song (text or a URL from any platform) -> yt-dlp
resolves it on YouTube -> m4a audio lands in R2 -> /radio plays the pool as a
synced pseudo-live station. Personal use for the member group, like everything
else here; the station page is session-authed and nothing is ever public.

Resolution: a YouTube URL downloads directly; any other URL gets its page's
og:title and becomes a search; plain text is a search (ytsearch1). We only take
YouTube's native AAC stream (bestaudio[ext=m4a]) so no ffmpeg is needed in the
image and iOS plays it natively.

Bot-check reality: YouTube regularly refuses datacenter IPs ("Sign in to
confirm you're not a bot"). On that failure the download retries once through
the DataImpulse residential proxy already configured for the NYT pull
(NYT_PROXY_*), with a fresh sticky session per attempt.
"""
import html
import logging
import random
import re
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

import requests

from . import config, db, storage

log = logging.getLogger("stackdock.radio")

_RUN_LOCK = threading.Lock()

_YT_HOSTS = ("youtube.com", "youtu.be", "music.youtube.com", "m.youtube.com")
_RETRY_HINTS = (
    # bot-checked (datacenter IP / burned proxy exit)
    "confirm you're not a bot", "confirm you are not a bot",
    "sign in to confirm", "429", "captcha",
    # transient mid-download failures through a flaky proxy exit (seen live
    # 3 Aug 2026: SSL EOF and a 36 KB-short truncation) — a fresh session fixes
    "unexpected_eof", "eof occurred", "bytes read", "incompleteread",
    "connection reset", "timed out",
)


# Now-playing artwork: assigned by track id so every listener sees the SAME
# image for the same song (part of "one broadcast"), and it never changes for a
# given track. Files live in static/radio-art/.
ART_COUNT = 12


def art_for(track_id: int) -> str:
    return f"/static/radio-art/{(int(track_id) % ART_COUNT) + 1}.jpg"


_NEEDLE_LOCK = threading.Lock()

# Share of the rotation that is "cool" (played longest ago) and therefore
# eligible to play before anything recently aired comes back around.
COOLDOWN_FRACTION = 0.7

# How many finished tracks one request will walk through before deciding the
# station was dormant and just resuming (see station_now).
MAX_CATCHUP_STEPS = 3


def station_order() -> list:
    """The running order is just two blocks:

      1. UP NEXT — a real queue, played until exhausted. A finished download
         joins the bottom automatically, and promoting an old track appends it
         the same way. Airing a track pops it off the queue.
      2. ROTATION — everything that has already played, LEAST-RECENTLY-PLAYED
         first, shuffled only within that constraint.

    Rotation is deliberately NOT a pure shuffle. The list changes constantly
    (tracks graduate out of Up Next, the daily seed rolls over), and each
    reshuffle can drop a song that just played right back near the front. So
    rotation is sorted by last_played_at and split: the older-played COOL block
    plays before the recently-played HOT block, with the daily seed shuffling
    inside each. You still get variety, but a song can't come back around until
    most of the others have had a turn.
    """
    tracks = [t for t in db.list_radio_tracks("ready") if (t["duration"] or 0) > 0]
    up_next = [t for t in tracks if t["promoted_at"]]     # list order = position
    rotation = [t for t in tracks if not t["promoted_at"]]
    # never-played sorts first ("" < any ISO timestamp)
    rotation.sort(key=lambda t: t["last_played_at"] or "")
    cut = max(1, int(len(rotation) * COOLDOWN_FRACTION))
    cool, hot = rotation[:cut], rotation[cut:]
    rnd = random.Random(int(datetime.now(timezone.utc).strftime("%Y%m%d")))
    rnd.shuffle(cool)
    rnd.shuffle(hot)
    return up_next + cool + hot


def _next_after(order: list, track_id: int | None):
    """The track following `track_id` in the current order (wrapping). Falls back
    to the head when the track is gone (deleted) or unknown."""
    ids = [t["id"] for t in order]
    if track_id in ids:
        return order[(ids.index(track_id) + 1) % len(order)]
    return order[0]


def station_now() -> dict | None:
    """What is on air, decided by the SERVER.

    The needle is explicit — radio_state holds the current track and when it
    started — rather than clock-modulo-playlist. That matters because the
    running order changes constantly (submissions, promotions, a track
    graduating out of 'Recently added' after it plays): with modulo arithmetic
    every such change re-maps the whole timeline and yanks the song you're
    hearing; with a needle it only affects what comes NEXT.

    Advancing happens lazily here, when someone asks, and each advance marks the
    finished track as aired (graduating it into the general rotation and
    consuming any Up Next pin).
    """
    with _NEEDLE_LOCK:
        order = station_order()
        if not order:
            return None
        st = db.radio_get_state()
        now_ts = time.time()
        cur = next((t for t in order if t["id"] == st["track_id"]), None)
        started, cycle = st["started_at"], st["cycle"]

        if cur is None or not started:            # first boot, or the track is gone
            cur = _next_after(order, st["track_id"]) if st["track_id"] else order[0]
            started, cycle = now_ts, cycle + 1
            db.radio_set_state(cur["id"], started, cycle)

        # Walk forward over tracks that finished since anyone last looked.
        # Bounded on purpose: nobody has to be listening for the clock to run,
        # so a quiet night would otherwise "play" the entire station in one
        # request — popping every queued song without anyone hearing it and
        # stamping last_played_at on the whole catalogue at the same instant
        # (which flattens the least-recently-played ordering). Past
        # MAX_CATCHUP_STEPS we treat the station as dormant and simply resume
        # with the next track from now.
        steps = 0
        while now_ts - started >= cur["duration"]:
            # Pick the successor from the order the finished track is STILL in.
            # Retiring it first would move it out of the queue and into the
            # shuffled rotation, so "the track after it" would be computed
            # against its new, unrelated position — which ping-ponged the
            # station between two songs (3 Aug 2026).
            nxt = _next_after(order, cur["id"])
            db.radio_mark_aired(cur["id"])        # retire it (queue -> rotation)
            order = station_order()
            if not order:
                return None
            if nxt["id"] not in [t["id"] for t in order]:   # deleted meanwhile
                nxt = order[0]
            dormant = steps >= MAX_CATCHUP_STEPS
            started = now_ts if dormant else started + cur["duration"]
            cycle += 1
            cur = nxt
            db.radio_set_state(cur["id"], started, cycle)
            if dormant:
                break
            steps += 1

        offset = max(0.0, min(now_ts - started, cur["duration"]))
        return {"track": cur, "offset": offset, "cycle": cycle,
                "remaining": cur["duration"] - offset,
                "count": len(order),
                "index": next((i for i, t in enumerate(order) if t["id"] == cur["id"]), 0)}


def station_skip(expected_cycle: int | None = None) -> bool:
    """Retire the current track and start the next one now. `expected_cycle`
    makes it a compare-and-swap: two listeners whose votes land at the same
    moment would otherwise each carry the skip and jump TWO tracks, so a caller
    passes the cycle it voted against and a stale one is refused."""
    with _NEEDLE_LOCK:
        order = station_order()
        if not order:
            return False
        st = db.radio_get_state()
        if expected_cycle is not None and st["cycle"] != expected_cycle:
            return False                           # already skipped/advanced
        nxt = _next_after(order, st["track_id"])   # successor first (see station_now)
        if st["track_id"]:
            db.radio_mark_aired(st["track_id"])
            fresh = station_order()
            if fresh and nxt["id"] not in [t["id"] for t in fresh]:
                nxt = fresh[0]
        db.radio_set_state(nxt["id"], time.time(), st["cycle"] + 1)
        return True


def votes_needed(listeners: int) -> int:
    """STRICT majority of current listeners (floor(n/2)+1), min 1 — with two
    people listening a single vote must not carry the skip."""
    return max(1, listeners // 2 + 1)


# YouTube titles carry promo tails and the artist as a prefix; uploaders are
# often a label or a re-upload channel ("Astro Nautico", "David Dean Burkhart"),
# so the artist is better guessed from the title than taken from the channel.
_TAIL_RE = re.compile(
    r"\s*[\(\[]\s*(?:official|lyric|lyrics|audio|video|visualiser|visualizer|"
    r"hd|hq|4k|mv|m/v|full|explicit|remaster\w*|music\s+video)[^\)\]]*[\)\]]", re.I)
_SEPS = (" - ", " – ", " — ", " ‐ ")


def _clean_title(raw: str) -> str:
    s = re.sub(r"\s*\|.*$", "", raw or "")        # "… | Audiotree Live"
    s = _TAIL_RE.sub("", s)
    return s.strip(" -–—·")


def _meta(info: dict, query: str) -> tuple[str, str]:
    """(title, artist) fit for display."""
    raw = (info.get("title") or query or "").strip()
    split_artist, rest = "", raw
    for sep in _SEPS:
        if sep in raw:
            split_artist, rest = (p.strip() for p in raw.split(sep, 1))
            break
    artist = (info.get("artist") or split_artist or info.get("creator")
              or info.get("uploader") or "").strip()
    title = _clean_title(info.get("track") or rest or raw)
    return (title or _clean_title(raw) or raw), artist


def _is_url(s: str) -> bool:
    return s.startswith(("http://", "https://"))


def _og_title(url: str) -> str | None:
    """Best-effort page title for non-YouTube links (Spotify/SoundCloud/etc.
    expose og:title), so a pasted link becomes a usable search query."""
    try:
        r = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        m = (re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', r.text)
             or re.search(r"<title[^>]*>([^<]+)</title>", r.text))
        return html.unescape(m.group(1)).strip() if m else None
    except requests.RequestException:
        return None


def _target(query: str) -> str:
    """What we hand yt-dlp."""
    q = query.strip()
    if _is_url(q):
        host = q.split("/")[2].lower().removeprefix("www.")
        if any(host == h or host.endswith("." + h) for h in _YT_HOSTS):
            return q
        title = _og_title(q)
        if not title:
            raise RuntimeError("couldn't read a title from that link — paste the song name instead")
        return f"ytsearch1:{title}"
    return f"ytsearch1:{q}"


def _proxy() -> str | None:
    """A fresh sticky-session residential proxy URL (DataImpulse via NYT_PROXY_*)."""
    if not (config.NYT_PROXY_SERVER and config.NYT_PROXY_USER):
        return None
    sessid = f"{config.NYT_PROXY_SESSION_PREFIX}radio{random.getrandbits(32):08x}"
    user = (f"{config.NYT_PROXY_USER}__cr.us;sessid.{sessid};"
            f"sessttl.{config.NYT_PROXY_STICKY_MINUTES}")
    scheme, rest = config.NYT_PROXY_SERVER.split("://", 1)
    return f"{scheme}://{user}:{config.NYT_PROXY_PASS}@{rest}"


def _ydl_opts(tmpdir: str, proxy: str | None) -> dict:
    opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]",
        "noplaylist": True,
        "outtmpl": str(Path(tmpdir) / "%(id)s.%(ext)s"),
        "quiet": True, "no_warnings": True,
        "socket_timeout": 30,
        "max_filesize": 100 * 1024 * 1024,
    }
    # Cookies are OFF unless explicitly enabled: an authenticated session gets
    # SABR-only responses (zero audio formats) even though it clears the
    # bot-check, so using them breaks downloads. See config.RADIO_USE_COOKIES.
    if (config.RADIO_USE_COOKIES and config.RADIO_COOKIES_FILE
            and Path(config.RADIO_COOKIES_FILE).exists()):
        opts["cookiefile"] = config.RADIO_COOKIES_FILE
    if proxy:
        opts["proxy"] = proxy
    return opts


def _download(query: str) -> dict:
    """Resolve + download one track. Returns {title, artist, source_url,
    audio_key, duration}. Raises with a member-readable message on failure."""
    import yt_dlp

    target = _target(query)
    last_err = None
    # direct first, then FRESH residential sessions on bot-check: DataImpulse
    # exits vary in quality (live test 3 Aug 2026: first session bot-checked,
    # next one sailed through), so one proxy try isn't enough
    for attempt in range(1 + config.RADIO_PROXY_TRIES):
        proxy = None if attempt == 0 else _proxy()
        if attempt and proxy is None:
            break                                # no proxy configured; done
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                with yt_dlp.YoutubeDL(_ydl_opts(tmpdir, proxy)) as ydl:
                    info = ydl.extract_info(target, download=False)
                    if info.get("entries") is not None:      # search result
                        entries = [e for e in info["entries"] if e]
                        if not entries:
                            raise RuntimeError("no YouTube result for that")
                        info = entries[0]
                    dur = float(info.get("duration") or 0)
                    if dur > config.RADIO_MAX_MINUTES * 60:
                        raise RuntimeError(
                            f"too long ({round(dur / 60)} min; cap is {config.RADIO_MAX_MINUTES})")
                    src = info.get("webpage_url") or info.get("original_url") or target
                    if db.radio_source_exists(src):
                        raise RuntimeError("already on the station")
                    # same song, different YouTube upload/title — checked BEFORE
                    # spending a download on it
                    title, artist = _meta(info, query)
                    if db.radio_title_exists(title, artist):
                        raise RuntimeError("already on the station (same song)")
                    ydl.download([info.get("webpage_url") or target])
                files = list(Path(tmpdir).iterdir())
                if not files:
                    raise RuntimeError("download produced no file")
                f = files[0]
                key = f"radio/{info['id']}.{f.suffix.lstrip('.') or 'm4a'}"
                with open(f, "rb") as fh:
                    storage.upload_stream(fh, key, "audio/mp4")
                return {"title": title, "artist": artist,
                        "source_url": src, "audio_key": key, "duration": dur}
            except Exception as e:                            # noqa: BLE001
                last_err = e
                msg = str(e).lower()
                if any(h in msg for h in _RETRY_HINTS):
                    log.info("radio: retryable failure (attempt %d); trying a fresh proxy session",
                             attempt + 1)
                    continue
                raise
    raise last_err if last_err else RuntimeError("download failed")


_SPOTIFY_TOKEN: dict = {"value": None, "expires": 0.0}


SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative"


def spotify_configured() -> bool:
    return bool(config.SPOTIFY_CLIENT_ID and config.SPOTIFY_CLIENT_SECRET)


def spotify_connected() -> bool:
    return bool(db.spotify_get_refresh_token())


def spotify_authorize_url(state: str) -> str:
    return "https://accounts.spotify.com/authorize?" + urlencode({
        "client_id": config.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": config.SPOTIFY_REDIRECT_URI,
        "scope": SPOTIFY_SCOPES,
        "state": state,
    })


def spotify_exchange_code(code: str) -> bool:
    """Swap the one-time authorization code for a refresh token (the only
    Spotify credential we keep)."""
    try:
        r = requests.post("https://accounts.spotify.com/api/token",
                          data={"grant_type": "authorization_code", "code": code,
                                "redirect_uri": config.SPOTIFY_REDIRECT_URI},
                          auth=(config.SPOTIFY_CLIENT_ID, config.SPOTIFY_CLIENT_SECRET),
                          timeout=20)
        if r.status_code != 200:
            log.warning("radio: Spotify code exchange failed (HTTP %s)", r.status_code)
            return False
        rt = r.json().get("refresh_token")
        if not rt:
            return False
        db.spotify_set_refresh_token(rt)
        _SPOTIFY_TOKEN.update(value=None, expires=0)
        log.info("radio: Spotify account connected.")
        return True
    except (requests.RequestException, ValueError) as e:
        log.warning("radio: Spotify code exchange error: %s", e.__class__.__name__)
        return False


def _spotify_token() -> str | None:
    """A USER token when an account is connected, else app-only client
    credentials. The distinction is the whole ballgame: under Spotify's 2025
    restrictions an app-only token returns playlist METADATA with an EMPTY
    track list (403 on /tracks, 0 items on the playlist object — measured
    3 Aug 2026), so only a user token can read a playlist's songs."""
    if not spotify_configured():
        return None
    if _SPOTIFY_TOKEN["value"] and time.time() < _SPOTIFY_TOKEN["expires"]:
        return _SPOTIFY_TOKEN["value"]
    refresh = db.spotify_get_refresh_token()
    data = ({"grant_type": "refresh_token", "refresh_token": refresh} if refresh
            else {"grant_type": "client_credentials"})
    try:
        r = requests.post("https://accounts.spotify.com/api/token", data=data,
                          auth=(config.SPOTIFY_CLIENT_ID, config.SPOTIFY_CLIENT_SECRET),
                          timeout=20)
        if r.status_code != 200:
            log.warning("radio: Spotify token request failed (HTTP %s)%s", r.status_code,
                        " — reconnect the account on /radio" if refresh else "")
            return None
        d = r.json()
        if d.get("refresh_token"):            # Spotify may rotate it
            db.spotify_set_refresh_token(d["refresh_token"])
        _SPOTIFY_TOKEN.update(value=d["access_token"],
                              expires=time.time() + float(d.get("expires_in", 3600)) - 60)
        return _SPOTIFY_TOKEN["value"]
    except (requests.RequestException, ValueError, KeyError) as e:
        log.warning("radio: Spotify token error: %s", e.__class__.__name__)
        return None


def _spotify_api_tracks(pid: str) -> list[str] | None:
    """Every track in the playlist via the Web API (paginated). None if the API
    isn't usable, so the caller can fall back to the embed."""
    token = _spotify_token()
    if not token:
        return None
    out, url = [], f"https://api.spotify.com/v1/playlists/{pid}/tracks"
    params = {"limit": 100, "offset": 0,
              "fields": "total,next,items(track(name,artists(name)))"}
    try:
        while url:
            r = requests.get(url, headers={"Authorization": f"Bearer {token}"},
                             params=params if "offset" in str(params) else None, timeout=25)
            if r.status_code != 200:
                log.warning("radio: Spotify playlist %s -> HTTP %s", pid, r.status_code)
                return None if not out else out
            d = r.json()
            for item in (d.get("items") or []):
                tr = item.get("track") or {}
                name = tr.get("name")
                if not name:
                    continue          # podcast episode / removed / local file
                artists = " ".join(a.get("name", "") for a in (tr.get("artists") or []))
                out.append(f"{name} {artists}".strip())
            url, params = d.get("next"), None
        log.info("radio: Spotify API returned %d track(s) for %s", len(out), pid)
        return out
    except (requests.RequestException, ValueError) as e:
        log.warning("radio: Spotify API error: %s", e.__class__.__name__)
        return out or None


def _spotify_playlist_tracks(url: str) -> list[str]:
    """Track queries ('title artist') for a PUBLIC Spotify playlist. Prefers the
    Web API (complete, paginated); falls back to the no-auth embed page, which
    only exposes a truncated head of a long playlist."""
    import json as _json

    m_id = re.search(r"playlist/([A-Za-z0-9]+)", url)
    if not m_id:
        return []
    pid = m_id.group(1)
    via_api = _spotify_api_tracks(pid)
    if via_api is not None:
        return via_api
    r = requests.get(f"https://open.spotify.com/embed/playlist/{pid}",
                     timeout=20, headers={"User-Agent": "Mozilla/5.0"})
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                  r.text, re.S)
    if not m:
        return []

    def find(o):
        if isinstance(o, dict):
            if "trackList" in o:
                return o["trackList"]
            for v in o.values():
                if (x := find(v)) is not None:
                    return x
        elif isinstance(o, list):
            for v in o:
                if (x := find(v)) is not None:
                    return x
        return None

    entries = find(_json.loads(m.group(1))) or []
    out = []
    for e in entries:
        title, artist = (e.get("title") or "").strip(), (e.get("subtitle") or "").strip()
        if title:
            out.append(f"{title} {artist}".strip())
    log.info("radio: Spotify embed returned %d track(s) for %s (set SPOTIFY_CLIENT_ID/"
             "SECRET for the full playlist — the embed truncates)", len(out), pid)
    return out


def sync_playlists() -> int:
    """Queue every not-yet-seen track from the watched playlists (RADIO_PLAYLISTS).
    Dedupe is by the exact query string, so failed tracks stay failed instead of
    re-queueing forever."""
    added = 0
    for url in config.RADIO_PLAYLISTS:
        try:
            queries = _spotify_playlist_tracks(url)
        except requests.RequestException as e:
            log.warning("radio: playlist fetch failed (%s): %s", url, e.__class__.__name__)
            continue
        for q in queries:
            if not db.radio_query_exists(q):
                db.add_radio_track(q, added_by="playlist")
                added += 1
    if added:
        log.info("radio: %d new track(s) queued from watched playlists", added)
    return added


def run() -> int:
    """Process pending submissions. Scheduler job 'radio' + triggered on submit."""
    if not _RUN_LOCK.acquire(blocking=False):
        return 0
    try:
        sync_playlists()
        done = 0
        for t in db.radio_pending():
            try:
                meta = _download(t["query"])
                db.radio_set_ready(t["id"], **meta)
                log.info("radio: [%s] ready — %s", t["added_by"], meta["title"])
                done += 1
            except Exception as e:                            # noqa: BLE001
                # "already on the station" isn't a failure worth showing — the
                # song IS there. Drop the row instead of parking junk in the
                # queue (the original row still blocks a re-queue).
                if "already on the station" in str(e):
                    db.delete_radio_track(t["id"])
                    log.info("radio: [%s] duplicate dropped (%s)", t["added_by"], t["query"])
                    continue
                db.radio_set_failed(t["id"], str(e))
                log.warning("radio: [%s] failed (%s): %s", t["added_by"], t["query"], e)
        return done
    finally:
        _RUN_LOCK.release()
