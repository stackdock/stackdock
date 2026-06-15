"""Probe a Patreon session cookie to see what we can pull as that member.

This is a SCOPING/TEST tool (Patreon support isn't wired into the app yet). Run it
ON THE DROPLET so it tests the same IP Stackdock would sync from (Patreon sits
behind Cloudflare, which can block datacenter IPs):

    cd /opt/stackdock
    read -s PATREON_SESSION && export PATREON_SESSION      # paste, hidden, no shell history
    docker compose exec -T -e PATREON_SESSION stackdock python scripts/debug_patreon.py

or locally:  read -s PATREON_SESSION && export PATREON_SESSION && python scripts/debug_patreon.py

The only cookie you need is `session_id` from a logged-in patreon.com session:
  patreon.com (logged in) -> F12 -> Application/Storage -> Cookies ->
  https://www.patreon.com -> copy the VALUE of `session_id`.

If Cloudflare blocks the droplet, we may also need other patreon.com cookies
(e.g. __cf_bm) or a different fetch strategy — this probe will tell us.
"""
import json
import os
import sys

import requests

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124 Safari/537.36")

# JSON:API endpoints the patreon.com web app itself calls.
PROBES = [
    ("current_user (auth check)",
     "https://www.patreon.com/api/current_user",
     {"fields[user]": "full_name,email,vanity"}),
    ("memberships (who you pledge to)",
     "https://www.patreon.com/api/current_user",
     {"include": "memberships.campaign",
      "fields[campaign]": "name,url",
      "fields[member]": "patron_status,currently_entitled_amount_cents"}),
    ("stream (posts from creators you back)",
     "https://www.patreon.com/api/stream",
     {"include": "campaign", "fields[post]": "title,published_at,is_paid,url",
      "fields[campaign]": "name", "page[count]": "10",
      "json-api-use-default-includes": "false"}),
]


def looks_like_cloudflare(r: requests.Response) -> bool:
    body = (r.text or "")[:2000].lower()
    return (r.status_code in (403, 503) and
            ("just a moment" in body or "cloudflare" in body or "cf-chl" in body
             or r.headers.get("server", "").lower().startswith("cloudflare")))


def main() -> int:
    cookie = (os.environ.get("PATREON_SESSION") or "").strip()
    if not cookie:
        print("Set PATREON_SESSION to your patreon.com `session_id` cookie value.")
        return 2

    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept": "*/*",
                      "Referer": "https://www.patreon.com/home"})
    s.cookies.set("session_id", cookie, domain=".patreon.com")

    ok_auth = False
    for label, url, params in PROBES:
        print("\n=== %s ===" % label)
        try:
            r = s.get(url, params=params, timeout=30)
        except requests.RequestException as e:
            print("  request error:", type(e).__name__, e)
            continue
        print("  HTTP", r.status_code, "| server:", r.headers.get("server", "?"))
        if looks_like_cloudflare(r):
            print("  >> Cloudflare challenge — this IP is being bot-blocked. "
                  "Server-side fetch from the droplet may not work as-is.")
            continue
        if r.status_code in (401, 403):
            print("  >> Not authenticated — cookie is missing/expired/wrong value.")
            continue
        try:
            data = r.json()
        except ValueError:
            print("  >> 200 but not JSON (login wall / HTML). First 200 chars:")
            print("    ", (r.text or "")[:200].replace("\n", " "))
            continue
        # JSON:API: {data: {...} | [...], included: [...]}
        d = data.get("data")
        if label.startswith("current_user (auth"):
            attrs = (d or {}).get("attributes", {}) if isinstance(d, dict) else {}
            who = attrs.get("full_name") or attrs.get("vanity") or "(unknown)"
            print("  >> logged in as:", who)
            ok_auth = True
        elif "memberships" in label:
            inc = data.get("included", [])
            camps = [i for i in inc if i.get("type") == "campaign"]
            print("  >> campaigns you pledge to:", len(camps))
            for c in camps[:15]:
                print("     -", c.get("attributes", {}).get("name"))
        else:  # stream
            posts = d if isinstance(d, list) else ([d] if d else [])
            print("  >> posts in feed sample:", len(posts))
            for p in posts[:10]:
                a = p.get("attributes", {})
                print("     - [%s] %s" % ("paid" if a.get("is_paid") else "free",
                                          a.get("title")))
    print("\nSummary:", "auth OK — we can build on this." if ok_auth
          else "auth NOT confirmed — see messages above.")
    return 0 if ok_auth else 1


if __name__ == "__main__":
    sys.exit(main())
