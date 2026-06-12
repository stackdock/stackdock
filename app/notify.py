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


def notify_article(article_id: int, publication: str, title: str) -> None:
    link = f"{config.PUBLIC_BASE_URL}/article/{article_id}"
    _post({
        "embeds": [{
            "title": title[:256],
            "url": link,
            "description": f"New article from **{publication}**",
            "color": 0x2E6E4E,
            "footer": {"text": "Stackdock · article"},
        }]
    })


def notify_episode(episode_id: int, feed_name: str, title: str, listen_url: str) -> None:
    page = f"{config.PUBLIC_BASE_URL}/episode/{episode_id}"
    _post({
        "embeds": [{
            "title": title[:256],
            "url": page,
            "description": f"New episode from **{feed_name}**\n[Direct audio link]({listen_url})",
            "color": 0x6E2E4E,
            "footer": {"text": "Stackdock · podcast"},
        }]
    })
