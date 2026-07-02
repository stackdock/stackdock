"""Probe an nytimes.com session cookie to see whether we can read a gated article
all the way through, as that logged-in subscriber.

SCOPING/TEST tool (NYT support isn't wired into the app yet). Same idea as
scripts/debug_patreon.py / debug_substack.py: the cookie goes in an ENV VAR,
never on the CLI and never pasted into chat.

Run locally:
    read -s NYT_COOKIE && export NYT_COOKIE      # paste, hidden, no shell history
    python scripts/debug_nyt.py "https://www.nytimes.com/live/2026/07/02/business/jobs-report-economy"

or on the droplet (tests the same IP Stackdock would sync from):
    cd /opt/stackdock
    read -s NYT_COOKIE && export NYT_COOKIE
    docker compose exec -T -e NYT_COOKIE stackdock python scripts/debug_nyt.py <url>

Getting the cookie (whole header is easiest, no guessing which sub-cookie matters):
  nytimes.com (logged in, subscription active) -> F12 -> Network tab ->
  reload -> click the document request -> Request Headers -> copy the FULL
  value of the `cookie:` header. That's NYT_COOKIE.
  (Minimum needed is usually the `NYT-S` cookie, but the full header is safest.)

What this tells us: whether the cookie authenticates, and whether the FULL article
body comes through vs. a metered/gated preview.
"""
import os
import re
import sys

import requests

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

DEFAULT_URL = ("https://www.nytimes.com/live/2026/07/02/business/"
               "jobs-report-economy")

# Markers that suggest we are NOT past the wall (metering / gate present).
GATE_MARKERS = [
    "gateway-content",           # NYT metered gateway container
    "You’ve reached your limit", "You've reached your limit",
    "Subscribe to continue", "subscribe to continue reading",
    "Create your free account", "already a subscriber",
    "css-gx5sib",                # common paywall wrapper class (may drift)
]

# Markers that we ARE logged in as a subscriber.
AUTH_MARKers = [
    '"isLoggedIn":true', '"loggedIn":true', "data-testid=\"user-settings-button\"",
    "My Account", "meta-user-details",
]


def looks_like_challenge(r: requests.Response) -> bool:
    server = (r.headers.get("server") or "").lower()
    body = (r.text or "")[:2000].lower()
    return (r.status_code in (401, 403, 503) and
            ("datadome" in server or "akamai" in server or "cloudflare" in server
             or "access denied" in body or "just a moment" in body
             or "unusual traffic" in body or "datadome" in body))


def extract_paragraphs(html: str) -> int:
    """Rough count of article paragraph text (StoryBodyCompanion / articleBody)."""
    # NYT renders body paragraphs as <p class="css-...">; count non-trivial ones.
    ps = re.findall(r"<p[^>]*>(.*?)</p>", html, flags=re.S)
    substantive = [p for p in ps if len(re.sub(r"<[^>]+>", "", p).strip()) > 60]
    return len(substantive)


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    cookie = (os.environ.get("NYT_COOKIE") or "").strip()
    if not cookie:
        print("Set NYT_COOKIE to your nytimes.com cookie header (or at least NYT-S).")
        print("See the module docstring for how to grab it.")
        return 2

    s = requests.Session()
    s.headers.update({
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": cookie,
        "Referer": "https://www.nytimes.com/",
    })

    print("=== fetching ===\n ", url)
    try:
        r = s.get(url, timeout=45)
    except requests.RequestException as e:
        print("  request error:", type(e).__name__, e)
        return 1

    print("  HTTP", r.status_code, "| server:", r.headers.get("server", "?"),
          "| bytes:", len(r.text or ""))
    if looks_like_challenge(r):
        print("  >> Bot/edge challenge (Akamai/CF) — this IP is being blocked. "
              "Try from a residential IP or add edge cookies.")
        return 1
    if r.status_code >= 400:
        print("  >> HTTP error — cookie may be expired/invalid or URL wrong.")
        return 1

    html = r.text or ""

    authed = any(m in html for m in AUTH_MARKers)
    gated = [m for m in GATE_MARKERS if m in html]
    paras = extract_paragraphs(html)

    print("\n=== signals ===")
    print("  logged in as subscriber:", "YES" if authed else "not detected")
    print("  gate/metering markers  :", gated if gated else "none")
    print("  substantive paragraphs :", paras)

    print("\n=== verdict ===")
    if authed and not gated and paras >= 5:
        print("  FULL ACCESS — cookie reads this article all the way through.")
        rc = 0
    elif not gated and paras >= 5:
        print("  Likely full text (paragraphs present, no gate) but subscriber "
              "login not explicitly confirmed. Spot-check the dump below.")
        rc = 0
    else:
        print("  GATED / partial — wall markers present or too few paragraphs. "
              "Cookie may be expired, free-tier, or the wall is client-rendered.")
        rc = 1

    # Save the raw HTML next to the scratchpad for manual inspection.
    out = os.environ.get("NYT_DUMP", "/tmp/nyt_dump.html")
    try:
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(html)
        print("\n  raw HTML written to", out, "(inspect to confirm full body)")
    except OSError as e:
        print("\n  (could not write dump:", e, ")")

    return rc


if __name__ == "__main__":
    sys.exit(main())
