"""Pull a gated NYT article server-side, past DataDome.

NYT sits behind DataDome, which defeats cookie-replay (requests/curl_cffi always
403 — DataDome needs real JS execution). The working recipe, proven on the
droplet, is a REAL browser through a residential proxy:

  * Playwright Chromium, headless=False, under Xvfb (a virtual display).
    Plain headless — even with stealth — is detected and blocked. Camoufox
    would be nicer (C++ fingerprint spoofing) but won't run on the droplet.
  * A residential proxy (the droplet's datacenter IP has negative DataDome
    trust). We use DataImpulse; the exit MUST be a real consumer ISP, not a
    hosting ASN, so we retry sticky sessions until we land on one.
  * A STICKY session (DataImpulse rotates per-request otherwise, which kills the
    IP-bound DataDome cookie between the first and second navigation).

Normal articles + interactive + Cooking work. Live blogs (/live/...) hit a
harder DataDome "Device Check" a GPU-less VM can't pass — we detect and reject
those with a clear error instead of hanging.

This module is import-safe (playwright is imported lazily inside fetch) so the
web app boots even if the browser stack isn't installed in a given environment.
"""
from __future__ import annotations

import json
import logging
import random
import re
import subprocess
import threading
from dataclasses import dataclass, field

import requests

from app import config, db

log = logging.getLogger(__name__)
_RUN_LOCK = threading.Lock()


def _reap_chromium() -> None:
    """Best-effort kill of leftover Chromium. Playwright doesn't always reap its
    headful child processes under Xvfb, and on a ~1 GB box those orphans pile up
    and OOM the server. NYT is the only thing here that launches Chromium, and
    run() holds a lock so no pull is concurrent — so a blanket sweep is safe."""
    for pat in ("chrome", "chromium", "headless_shell"):
        try:
            subprocess.run(["pkill", "-9", "-f", pat],
                           timeout=10, check=False)
        except Exception:                                       # noqa: BLE001
            pass

# DataDome blocks datacenter/hosting ASNs. Rather than a fragile whitelist of
# ISP names (which rejects legit regional ISPs and wastes attempts), we BLOCK
# known hosting orgs and accept any other US exit — DataDome itself is the final
# judge, and a rare hosting IP that slips through just fails and we retry.
_HOSTING_HINTS = ("hosting", "datacenter", "data center", "cloud", "colo",
                  "colocation", "zayo", "digitalocean", "amazon", "google",
                  "ovh", "hetzner", "linode", "vultr", "dynanode",
                  "computer services", "m247", "cogent", "level 3", "gtt")

_ARTICLE_SELECTOR = ("article p, section[name=articleBody] p, "
                     "div[data-testid=live-blog-post] p")
_GATE_MARKERS = ("gateway-content", "reached your limit", "Subscribe to continue",
                 "Create your free account")


class NytFetchError(RuntimeError):
    """Generic failure (blocked, timeout, no content)."""


class NytLiveBlogUnsupported(NytFetchError):
    """Live-blog URL that hits the DataDome device-check we can't pass yet."""


@dataclass
class NytArticle:
    url: str
    canonical_url: str
    title: str
    byline: str = ""
    section: str = ""
    published_at: str = ""
    body_html: str = ""
    body_text: str = ""
    image_url: str = ""
    kind: str = "article"          # article | cooking | interactive
    paragraphs: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        d = self.__dict__.copy()
        d.pop("paragraphs", None)
        return d


def is_nyt_url(url: str) -> bool:
    return bool(re.match(r"https?://(www\.|cooking\.)?nytimes\.com/", url.strip(),
                         re.I))


def is_live_blog(url: str) -> bool:
    return "/live/" in url.lower()


def classify(url: str) -> str:
    u = url.lower()
    if "cooking.nytimes.com" in u:
        return "cooking"
    if "/interactive/" in u:
        return "interactive"
    return "article"


def _proxy_username(sessid: str) -> str:
    """DataImpulse sticky-session username: US exit, held for sessttl minutes."""
    base = config.NYT_PROXY_USER
    ttl = config.NYT_PROXY_STICKY_MINUTES
    return f"{base}__cr.us;sessid.{sessid};sessttl.{ttl}"


def _cookies_for(raw: str) -> list[dict]:
    out = []
    for part in (raw or "").split(";"):
        part = part.strip()
        if "=" in part:
            name, val = part.split("=", 1)
            name = name.strip()
            # never inject a stale, IP-bound datadome cookie — the browser earns
            # a fresh one through the proxy IP.
            if name.lower() == "datadome":
                continue
            out.append({"name": name, "value": val.strip(),
                        "domain": ".nytimes.com", "path": "/"})
    return out


def _looks_residential(org: str) -> bool:
    """Accept any exit that isn't a known hosting/datacenter org (blocklist)."""
    o = (org or "").lower()
    return bool(o) and not any(h in o for h in _HOSTING_HINTS)


def _find_clean_session() -> tuple[str | None, str]:
    """Find a sticky proxy sessid whose exit is a clean US (non-hosting) IP,
    using cheap requests calls — NO browser. This is the memory-critical bit: a
    headful Chromium is ~400 MB, so we must NOT launch one per proxy attempt.
    Returns (sessid, org) or (None, reason)."""
    for _ in range(config.NYT_PROXY_MAX_TRIES):
        sessid = f"{config.NYT_PROXY_SESSION_PREFIX}{random.getrandbits(32):08x}"
        user = _proxy_username(sessid)
        scheme, rest = config.NYT_PROXY_SERVER.split("://", 1)
        px = f"{scheme}://{user}:{config.NYT_PROXY_PASS}@{rest}"
        try:
            r = requests.get("https://ipinfo.io/json",
                             proxies={"http": px, "https": px}, timeout=15)
            info = r.json()
        except Exception:                                       # noqa: BLE001
            continue
        org = info.get("org", "")
        if info.get("country") == "US" and _looks_residential(org):
            return sessid, org
    return None, "no clean US residential exit found"


def fetch_nyt_article(url: str, nyt_cookie: str | None = None) -> NytArticle:
    """Pull one NYT article. Raises NytFetchError / NytLiveBlogUnsupported."""
    url = url.strip()
    if not is_nyt_url(url):
        raise NytFetchError("Not an nytimes.com URL.")
    if is_live_blog(url):
        raise NytLiveBlogUnsupported(
            "Live blogs hit a DataDome device check we can't pass yet — "
            "regular articles and Cooking recipes work.")

    nyt_cookie = nyt_cookie or config.NYT_COOKIE
    if not config.NYT_PROXY_SERVER:
        raise NytFetchError("NYT_PROXY_SERVER not configured.")

    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    ua = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    cookies = _cookies_for(nyt_cookie)

    with sync_playwright() as pw:
        last_err = "no clean residential proxy IP found"
        # Launch a browser only for the ACTUAL pull, and only a few times — never
        # one per proxy attempt (that OOM'd the droplet: headful Chromium ~400 MB).
        for _btry in range(config.NYT_BROWSER_TRIES):
            # Vet the exit IP with cheap requests calls first (no browser).
            sessid, org = _find_clean_session()
            if not sessid:
                last_err = org
                break   # pool is all hosting right now — a browser won't help
            proxy = {"server": config.NYT_PROXY_SERVER,
                     "username": _proxy_username(sessid),
                     "password": config.NYT_PROXY_PASS}
            browser = pw.chromium.launch(
                headless=False, proxy=proxy,
                args=["--disable-blink-features=AutomationControlled",
                      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                      "--no-zygote", "--js-flags=--max-old-space-size=256"])
            try:
                ctx = browser.new_context(
                    user_agent=ua, locale="en-US",
                    timezone_id="America/New_York",
                    viewport={"width": 1366, "height": 900})
                ctx.add_init_script(
                    "Object.defineProperty(navigator,'webdriver',"
                    "{get:()=>undefined});")
                page = ctx.new_page()

                # IP is already vetted clean US residential — go straight to the
                # site: prime DataDome on the home page (usually no challenge).
                ctx.add_cookies(cookies)
                page.goto("https://www.nytimes.com/",
                          wait_until="commit", timeout=60000)
                page.wait_for_timeout(5000)

                # the article itself
                try:
                    page.goto(url, wait_until="commit", timeout=60000)
                except PWTimeout:
                    pass
                cooking = classify(url) == "cooking"
                got, recipe, stuck = 0, None, 0
                for _ in range(config.NYT_FETCH_POLL_TRIES):
                    page.wait_for_timeout(3000)
                    if (page.title() or "") == "nytimes.com":   # DataDome interstitial
                        # a solvable interstitial clears in a few seconds; if it
                        # persists it's a hard device check — bail early so we don't
                        # keep a browser alive 45s (memory) before retrying a new IP.
                        stuck += 1
                        if stuck >= 4:
                            break
                        continue
                    if cooking:
                        # recipes live in a schema.org Recipe JSON-LD, not <p> tags
                        recipe = page.evaluate(_RECIPE_JS)
                        if recipe:
                            break
                    else:
                        got = page.evaluate(
                            f"() => document.querySelectorAll('{_ARTICLE_SELECTOR}').length")
                        if got >= 5:
                            break
                html = page.content()
                if (page.title() or "") == "nytimes.com" or "captcha-delivery" in html:
                    last_err = "DataDome device check (article blocked on this IP)"
                    browser.close()
                    continue
                if cooking:
                    if not recipe:
                        last_err = "recipe data (schema.org Recipe) not found"
                        browser.close()
                        continue
                    art = _extract_recipe(url, recipe)
                else:
                    if got < 5:
                        last_err = "no article body found (paywalled without access?)"
                        browser.close()
                        continue
                    art = _extract(page, url)
                browser.close()
                return art
            except Exception as e:               # noqa: BLE001 — retry on any failure
                last_err = f"{type(e).__name__}: {e}"
                try:
                    browser.close()
                except Exception:
                    pass
                continue
        raise NytFetchError(f"Could not pull article after "
                            f"{config.NYT_BROWSER_TRIES} browser attempts: {last_err}")


def _extract(page, url: str) -> NytArticle:
    meta = page.evaluate(
        """() => {
            const g = (s) => document.querySelector(s);
            const c = (n) => (g(`meta[property="${n}"]`)||g(`meta[name="${n}"]`)||{}).content||'';
            const paras = Array.from(document.querySelectorAll(
                'article p, section[name=articleBody] p, div[data-testid=live-blog-post] p'
            )).map(p => p.innerText.trim()).filter(t => t.length > 40);
            const bylineEl = g('[data-testid=byline] , .last-byline, [class*=byline] a');
            return {
                title: c('og:title') || document.title,
                section: c('article:section') || c('ad:section'),
                published: c('article:published_time') || c('article:published'),
                image: c('og:image'),
                canonical: (g('link[rel=canonical]')||{}).href || location.href,
                byline: bylineEl ? bylineEl.innerText.trim() : '',
                paras,
            };
        }"""
    )
    paras = meta.get("paras") or []
    body_html = "\n".join(f"<p>{_escape(p)}</p>" for p in paras)
    return NytArticle(
        url=url,
        canonical_url=(meta.get("canonical") or url).split("?")[0],
        title=(meta.get("title") or "").strip(),
        byline=(meta.get("byline") or "").strip(),
        section=(meta.get("section") or "").strip(),
        published_at=(meta.get("published") or "").strip(),
        image_url=(meta.get("image") or "").strip(),
        body_html=body_html,
        body_text="\n\n".join(paras),
        kind=classify(url),
        paragraphs=paras,
    )


def _escape(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# NYT Cooking recipes aren't in <article><p> — the content is a schema.org
# Recipe JSON-LD. Find and return it (or null) from the page.
_RECIPE_JS = """() => {
  const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
  for (const b of blocks) {
    let data; try { data = JSON.parse(b.textContent); } catch (e) { continue; }
    const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
    for (const it of items) {
      const t = it && it['@type'];
      if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return it;
    }
  }
  return null;
}"""


def _ld_name(x) -> str:
    if isinstance(x, dict):
        return x.get("name", "") or ""
    if isinstance(x, list):
        return ", ".join(_ld_name(i) for i in x if i)
    return x or ""


def _fmt_duration(iso: str) -> str:
    """ISO-8601 duration ('PT1H30M') -> '1 hr 30 min'. Passthrough on no match."""
    if not iso:
        return ""
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", iso)
    if not m or not (m.group(1) or m.group(2)):
        return iso
    h, mn = m.group(1), m.group(2)
    return " ".join(p for p in [f"{h} hr" if h else "", f"{mn} min" if mn else ""] if p)


def _extract_recipe(url: str, r: dict) -> NytArticle:
    """Build a readable article from a schema.org Recipe JSON-LD block."""
    title = (r.get("name") or "").strip()
    author = _ld_name(r.get("author"))
    desc = (r.get("description") or "").strip()
    ingredients = [str(i).strip() for i in (r.get("recipeIngredient") or []) if i]
    steps = []
    for s in (r.get("recipeInstructions") or []):
        if isinstance(s, dict):
            steps.append((s.get("text") or s.get("name") or "").strip())
        elif isinstance(s, str):
            steps.append(s.strip())
    steps = [s for s in steps if s]

    yield_ = r.get("recipeYield")
    if isinstance(yield_, list):
        yield_ = yield_[0] if yield_ else ""
    image = r.get("image")
    if isinstance(image, list):
        image = image[0] if image else ""
    if isinstance(image, dict):
        image = image.get("url") or image.get("@id") or ""

    parts = []
    if desc:
        parts.append(f"<p>{_escape(desc)}</p>")
    meta = [b for b in [_escape(str(yield_)) if yield_ else "",
                        _fmt_duration(r.get("totalTime") or "")] if b]
    if meta:
        parts.append("<p><em>" + " · ".join(meta) + "</em></p>")
    if ingredients:
        parts.append("<h3>Ingredients</h3><ul>"
                     + "".join(f"<li>{_escape(i)}</li>" for i in ingredients) + "</ul>")
    if steps:
        parts.append("<h3>Preparation</h3><ol>"
                     + "".join(f"<li>{_escape(s)}</li>" for s in steps) + "</ol>")

    return NytArticle(
        url=url, canonical_url=url.split("?")[0], title=title, byline=author,
        section="Cooking", published_at=(r.get("datePublished") or "").strip(),
        body_html="\n".join(parts),
        body_text="\n\n".join([desc] + ingredients + steps),
        image_url=str(image or ""), kind="cooking",
        paragraphs=(steps or ingredients),
    )


def run() -> int:
    """Process every pending ('pulling') NYT row. Returns count pulled OK.

    Non-blocking lock so a manual /nyt/sync can't stack on the scheduler run
    (same posture as substack.run).
    """
    if not _RUN_LOCK.acquire(blocking=False):
        log.info("nyt pull already running; skipping overlapping run.")
        return 0
    try:
        return _run()
    finally:
        _reap_chromium()   # sweep any browser Playwright left behind (OOM guard)
        _RUN_LOCK.release()


def _run() -> int:
    pending = db.list_nyt_pending()
    pulled = 0
    for row in pending:
        row_id, url = row["id"], row["original_url"]
        try:
            art = fetch_nyt_article(url)
            db.finish_nyt_article(
                row_id, canonical_url=art.canonical_url, title=art.title,
                author=art.byline, section=art.section, kind=art.kind,
                html=art.body_html, published_at=art.published_at,
                cover_image=art.image_url)
            pulled += 1
            log.info("NYT pulled %r (%d paragraphs)", art.title, len(art.paragraphs))
        except NytFetchError as e:
            db.set_nyt_status(row_id, f"failed: {e}"[:300])
            log.warning("NYT pull failed for %s: %s", url, e)
        except Exception as e:                       # noqa: BLE001
            db.set_nyt_status(row_id, f"failed: {type(e).__name__}: {e}"[:300])
            log.exception("NYT pull crashed for %s", url)
    return pulled


if __name__ == "__main__":     # manual test: python -m app.ingest.nyt <url>
    import sys
    a = fetch_nyt_article(sys.argv[1])
    print(json.dumps({**a.as_dict(), "n_paragraphs": len(a.paragraphs)},
                     indent=2)[:1200])
