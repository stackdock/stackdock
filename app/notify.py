"""Post new-content notifications to a Discord channel via webhook."""
import logging
import threading
import time
from datetime import datetime, timedelta, timezone

import requests

from . import config

log = logging.getLogger("stackdock.notify")

_MAX_TRIES = 3


def _post(payload: dict) -> bool:
    """Deliver one Discord webhook payload. Returns True on success (2xx) OR when
    no webhook is configured (nothing to send). Returns False when a configured
    webhook could not be delivered — the caller uses this to decide whether to
    leave items pending (so a Discord outage/429 doesn't silently drop a digest).
    Retries 429/5xx, honoring Retry-After."""
    if not config.DISCORD_WEBHOOK_URL:
        return True
    for attempt in range(_MAX_TRIES):
        try:
            r = requests.post(config.DISCORD_WEBHOOK_URL, json=payload, timeout=15)
            if r.status_code < 400:
                return True
            if r.status_code in (429, 500, 502, 503, 504) and attempt < _MAX_TRIES - 1:
                wait = _retry_after(r, attempt)
                log.warning("Discord webhook %s — retrying in %.1fs", r.status_code, wait)
                time.sleep(wait)
                continue
            log.warning("Discord webhook failed: %s %s", r.status_code, r.text[:300])
            return False
        except requests.RequestException as e:
            if attempt < _MAX_TRIES - 1:
                time.sleep(2 * 2 ** attempt)
                continue
            log.warning("Discord webhook error: %s", e)
            return False
    return False


def _retry_after(r: requests.Response, attempt: int) -> float:
    """Seconds to wait before retrying, preferring the server's Retry-After
    (Discord sends it on 429), capped, with exponential fallback."""
    hdr = r.headers.get("Retry-After")
    if hdr:
        try:
            return min(30.0, float(hdr))
        except (TypeError, ValueError):
            pass
    return min(30.0, 2 * 2 ** attempt)


def notify_reset_request(username: str) -> None:
    """Ping the shared channel that someone needs a reset — never the link itself."""
    _post({
        "embeds": [{
            "title": "Password reset requested",
            "description": (f"**{username[:80]}** forgot their password.\n"
                            f"Admin: generate a one-time link at {config.PUBLIC_BASE_URL}/admin "
                            f"and **DM it to them privately** (never post it here)."),
            "color": 0xB8860B,
            "footer": {"text": "Stackdock · account"},
        }]
    })


def notify_bussy_purchase(username: str) -> None:
    """A member entered a valid card in the Bussy Zone checkout."""
    _post({
        "embeds": [{
            "title": "🔞 New Bussy Zone member!",
            "description": f"**{username[:80]}** just subscribed to the Felix Bussy Zone 💜🍑",
            "color": 0xA020F0,
            "footer": {"text": "Felix Bussy Zone"},
        }]
    })


def notify_stale_cookie(service: str, label: str, owner: str, reminder: bool = False) -> None:
    title = (f"🔁 Reminder: {service} cookie still expired"
             if reminder else f"⚠️ {service.capitalize()} cookie expired")
    body = (f"**{label}** (owned by **{owner}**) has a stale {service} cookie — "
            f"syncing for this account is stopped"
            f"{' and has been for a while' if reminder else ''}.\n"
            f"{owner}: log in and reconnect it at {config.PUBLIC_BASE_URL}/accounts")
    _post({
        "embeds": [{
            "title": title,
            "description": body,
            "color": 0xC0392B,
            "footer": {"text": "Stackdock · sync health"},
        }]
    })


def alert_if_stale(account, new_status: str, service: str, get_user, set_alert) -> None:
    """Alert on the transition into STALE, then re-alert every
    STALE_REMINDER_HOURS while it stays broken. Silent once fixed."""
    if not new_status.startswith("STALE"):
        return
    was_stale = (account["status"] or "").startswith("STALE")
    now = datetime.now(timezone.utc)

    if not was_stale:
        due, reminder = True, False
    elif config.STALE_REMINDER_HOURS > 0:
        last = account["last_alert"]
        try:
            last_dt = datetime.fromisoformat(last) if last else None
        except ValueError:
            last_dt = None
        due = last_dt is None or last_dt <= now - timedelta(hours=config.STALE_REMINDER_HOURS)
        reminder = True
    else:
        due, reminder = False, False

    if due:
        owner = get_user(account["user_id"])
        notify_stale_cookie(service, account["label"],
                            owner["username"] if owner else "unknown", reminder=reminder)
        set_alert(account["id"], now.isoformat())


# ---- Unified push: one digest per sync run, across all users & publications ----

DIGEST_MAX_LINES = 15


def _item_line(item: dict) -> str:
    icon = "🎧" if item["type"] == "episode" else "📰"
    return f"{icon} **{item['source'][:60]}** — [{item['title'][:120]}]({item['url']})"


def notify_digest(items: list[dict]) -> bool:
    """ONE Discord embed listing every new item from a sync run. Returns whether
    it was delivered (True also when there's nothing to send)."""
    if not items:
        return True
    n_art = sum(1 for i in items if i["type"] == "article")
    n_ep = len(items) - n_art
    lines = [_item_line(i) for i in items[:DIGEST_MAX_LINES]]
    if len(items) > DIGEST_MAX_LINES:
        lines.append(f"…and **{len(items) - DIGEST_MAX_LINES} more** on the site")
    parts = []
    if n_art:
        parts.append(f"{n_art} article{'s' if n_art != 1 else ''}")
    if n_ep:
        parts.append(f"{n_ep} episode{'s' if n_ep != 1 else ''}")
    return _post({
        "embeds": [{
            "title": f"New on Stackdock: {' + '.join(parts)}",
            "url": config.PUBLIC_BASE_URL,
            "description": "\n".join(lines)[:4000],
            "color": 0x2E6E4E,
            "footer": {"text": "Stackdock · sync digest"},
        }]
    })


def push_outbound(items: list[dict]) -> None:
    """POST one combined JSON payload of everything new to OUTBOUND_WEBHOOK_URL."""
    if not items or not config.OUTBOUND_WEBHOOK_URL:
        return
    payload = {
        "source": "stackdock",
        "site": config.PUBLIC_BASE_URL,
        "new_articles": [i for i in items if i["type"] == "article"],
        "new_episodes": [i for i in items if i["type"] == "episode"],
    }
    try:
        r = requests.post(config.OUTBOUND_WEBHOOK_URL, json=payload, timeout=15)
        if r.status_code >= 400:
            log.warning("Outbound webhook failed: %s %s", r.status_code, r.text[:300])
    except requests.RequestException as e:
        log.warning("Outbound webhook error: %s", e)


def push_new_items(items: list[dict]) -> bool:
    """Single entry point for ingesters: one Discord digest + one outbound POST.
    Returns whether the PRIMARY (Discord) digest was delivered — the outbound
    webhook is best-effort and does not gate this (retrying it would re-send the
    Discord digest, which is worse than dropping a secondary mirror POST).

    Each item: {"type": "article"|"episode", "source": publication or feed name,
                "title": ..., "url": .../read/{slug} or .../listen/{slug},
                "original_url": ..., "published_at": ...}
    """
    ok = notify_digest(items)
    push_outbound(items)
    return ok


def notify_youtube(priority: list[dict], normal: list[dict]) -> None:
    """PRIORITY uploads @everyone the server; the rest get a normal embed.
    Each item: {"channel": ..., "title": ..., "url": watch-url}."""
    def _lines(vids, icon):
        out = [f"{icon} **{v['channel'][:60]}** — [{v['title'][:150]}]({v['url']})"
               for v in vids[:DIGEST_MAX_LINES]]
        if len(vids) > DIGEST_MAX_LINES:
            out.append(f"…and **{len(vids) - DIGEST_MAX_LINES} more**")
        return "\n".join(out)[:4000]

    if priority:
        _post({
            "content": "@everyone 🚨 **PRIORITY**",
            "allowed_mentions": {"parse": ["everyone"]},
            "embeds": [{
                "title": "🚨 PRIORITY upload",
                "description": _lines(priority, "🚨"),
                "color": 0xC0392B,
                "footer": {"text": f"{config.SITE_TITLE} · YouTube"},
            }],
        })
    if normal:
        n = len(normal)
        _post({
            "embeds": [{
                "title": f"New YouTube upload{'s' if n != 1 else ''}",
                "description": _lines(normal, "▶️"),
                "color": 0xC4302B,
                "footer": {"text": f"{config.SITE_TITLE} · YouTube"},
            }],
        })


_FLUSH_LOCK = threading.Lock()


def flush() -> None:
    """Resilient digest: announce every not-yet-notified item, then mark them.
    The pending set lives in the DB (notified=0), so a sync that dies before this
    point leaves items pending and the NEXT run sends them — a digest is never
    silently lost to a crash/restart mid-run.

    Items are marked notified ONLY when the Discord digest actually posts, so a
    webhook outage/429 leaves them pending for the next run instead of silently
    dropping them. The lock serializes concurrent ingesters (substack/podcast/
    email/patreon runs can finish close together) so the same items aren't
    listed-and-sent twice → no double Discord post."""
    from . import db
    with _FLUSH_LOCK:
        items = db.list_unnotified_items()
        if not items:
            return
        if push_new_items(items):
            db.mark_items_notified(items)
        else:
            log.warning("Digest delivery failed; %d item(s) stay pending for the "
                        "next run.", len(items))
