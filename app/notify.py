"""Post new-content notifications to a Discord channel via webhook."""
import logging
from datetime import datetime, timedelta, timezone

import requests

from . import config

log = logging.getLogger("stackdock.notify")


def _post(payload: dict) -> None:
    if not config.DISCORD_WEBHOOK_URL:
        return
    try:
        r = requests.post(config.DISCORD_WEBHOOK_URL, json=payload, timeout=15)
        if r.status_code >= 400:
            log.warning("Discord webhook failed: %s %s", r.status_code, r.text[:300])
    except requests.RequestException as e:
        log.warning("Discord webhook error: %s", e)


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


def notify_digest(items: list[dict]) -> None:
    """ONE Discord embed listing every new item from a sync run."""
    if not items:
        return
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
    _post({
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


def push_new_items(items: list[dict]) -> None:
    """Single entry point for ingesters: one Discord digest + one outbound POST.

    Each item: {"type": "article"|"episode", "source": publication or feed name,
                "title": ..., "url": .../read/{slug} or .../listen/{slug},
                "original_url": ..., "published_at": ...}
    """
    notify_digest(items)
    push_outbound(items)


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


def flush() -> None:
    """Resilient digest: announce every not-yet-notified item, then mark them.
    The pending set lives in the DB (notified=0), so a sync that dies before this
    point leaves items pending and the NEXT run sends them — a digest is never
    silently lost to a crash/restart mid-run."""
    from . import db
    items = db.list_unnotified_items()
    if not items:
        return
    push_new_items(items)
    db.mark_items_notified(items)
