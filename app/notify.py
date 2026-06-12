"""Post new-content notifications to a Discord channel via webhook."""
import logging

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
