"""Pull Substack posts out of a collector inbox over IMAP.

Strategy: every Substack account you own forwards its mail to one inbox
(or is subscribed with a plus-address of that inbox). This module polls
the inbox, takes any UNSEEN message from an allowed sender domain,
extracts the HTML body, cleans it, and stores it as an article.
"""
import email
import email.policy
import imaplib
import logging
import re
from email.utils import parseaddr, parsedate_to_datetime

from bs4 import BeautifulSoup

from .. import config, db, notify

log = logging.getLogger("stackdock.email")


def _clean_html(html: str) -> tuple[str, str | None]:
    """Strip tracking junk from a Substack email; return (clean_html, original_url)."""
    soup = BeautifulSoup(html, "lxml")

    # Remove tracking pixels and tiny images
    for img in soup.find_all("img"):
        w, h = img.get("width"), img.get("height")
        if (w in ("1", "0")) or (h in ("1", "0")):
            img.decompose()

    # Remove scripts/styles that came along
    for tag in soup.find_all(["script", "style"]):
        tag.decompose()

    # Try to find the canonical post URL ("View in browser" / post link)
    original_url = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        m = re.search(r"https://[^/]+\.substack\.com/p/[A-Za-z0-9\-_]+", href)
        if m:
            original_url = m.group(0)
            break

    # Strip redirect-tracking from links where the real URL is recoverable
    for a in soup.find_all("a", href=True):
        m = re.search(r"https?://substack\.com/redirect/", a["href"])
        if m:
            a["href"] = original_url or a["href"]

    body = soup.body or soup
    return body.decode_contents(), original_url


def _extract_html(msg) -> str | None:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                return part.get_content()
    elif msg.get_content_type() == "text/html":
        return msg.get_content()
    return None


def _sender_allowed(from_addr: str) -> bool:
    domain = from_addr.rsplit("@", 1)[-1].lower()
    return any(domain == d or domain.endswith("." + d) for d in config.IMAP_ALLOWED_SENDER_DOMAINS)


def run() -> int:
    """Poll the inbox once. Returns number of new articles."""
    if not config.IMAP_HOST or not config.IMAP_USER:
        log.info("IMAP not configured; skipping email ingest.")
        return 0

    new_count = 0
    M = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
    try:
        M.login(config.IMAP_USER, config.IMAP_PASS)
        M.select(config.IMAP_FOLDER)
        status, data = M.search(None, "UNSEEN")
        if status != "OK":
            return 0
        ids = data[0].split()
        log.info("Email ingest: %d unseen messages", len(ids))

        for num in ids:
            status, msg_data = M.fetch(num, "(RFC822)")
            if status != "OK" or not msg_data or msg_data[0] is None:
                continue
            msg = email.message_from_bytes(msg_data[0][1], policy=email.policy.default)

            display_name, from_addr = parseaddr(msg.get("From", ""))
            if not _sender_allowed(from_addr):
                # Leave non-newsletter mail untouched but mark seen so we don't loop on it
                continue

            message_id = msg.get("Message-ID", "").strip() or f"no-id-{num.decode()}"
            if db.article_exists(message_id):
                continue

            html = _extract_html(msg)
            if not html:
                continue

            clean, original_url = _clean_html(html)
            title = msg.get("Subject", "(untitled)")
            try:
                published_at = parsedate_to_datetime(msg.get("Date")).isoformat()
            except Exception:
                published_at = None

            publication = display_name or from_addr.split("@")[0]
            article_id = db.insert_article(
                message_id=message_id,
                publication=publication,
                title=title,
                author=publication,
                original_url=original_url,
                html=clean,
                published_at=published_at,
            )
            if article_id:
                new_count += 1
                log.info("New article: [%s] %s", publication, title)
                notify.notify_article(article_id, publication, title)

        return new_count
    finally:
        try:
            M.logout()
        except Exception:
            pass
