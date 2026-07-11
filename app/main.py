"""Stackdock — personal newsletter & podcast mirror (multi-user)."""
import json
import logging
import secrets as pysecrets
import shutil
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, Form, HTTPException, Query, Request, Response
from fastapi.responses import (FileResponse, HTMLResponse, JSONResponse,
                               RedirectResponse, StreamingResponse)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import auth, config, db, feedgen, metrics, notify, sanitize, storage
from .ingest import email_ingest, mde, nyt, patreon, podcast_rss, substack, youtube

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("stackdock")

templates = Jinja2Templates(directory=Path(__file__).parent / "templates")
# Scrub remote HTML (article bodies, episode notes) at render time — use
# `{{ value | sanitize }}` instead of `| safe` for anything third-party.
templates.env.filters["sanitize"] = sanitize.clean


def _safe_url(url: str | None) -> str:
    """Only allow http(s) links from remote-controlled URL fields (an original_url
    could be a stored `javascript:` scheme). Everything else collapses to '#'."""
    u = (url or "").strip()
    return u if u[:7].lower() == "http://" or u[:8].lower() == "https://" else "#"


templates.env.filters["safe_url"] = _safe_url
scheduler = BackgroundScheduler()

START_TIME = datetime.now(timezone.utc)
JOB_STATE: dict[str, dict] = {}   # job_id -> {last_run, result, ok}

# all ingest jobs, by id — the scheduler AND the manual sync buttons both go
# through run_job() so /status reflects manual runs too (not just scheduled ones)
JOBS = {"email": email_ingest.run, "podcasts": podcast_rss.run,
        "substack": substack.run, "patreon": patreon.run, "nyt": nyt.run,
        "substack_refresh": substack.refresh_locked,
        "verify_paid": substack.verify_paid_access, "youtube": youtube.run,
        "mde": mde.run, "mde_catalogue": mde.refresh}


def run_job(job_id: str) -> int | None:
    """Run an ingest job and record its outcome for /status. Returns the new-item
    count, or None on failure (recorded, never raised — a manual run or the
    scheduler must not crash on an ingest error)."""
    started = datetime.now(timezone.utc)
    try:
        n = JOBS[job_id]()
        JOB_STATE[job_id] = {"last_run": started, "result": f"{n} new item(s)", "ok": True}
        return n
    except Exception as e:
        JOB_STATE[job_id] = {"last_run": started, "result": f"{type(e).__name__}: {e}", "ok": False}
        log.exception("Job %s failed", job_id)
        return None


def _tracked(job_id: str):
    """A stable, named callable for the scheduler that records JOB_STATE."""
    runner = lambda: run_job(job_id)
    runner.__name__ = f"{job_id}_job"
    return runner


def _trigger_job(job_id: str):
    """Kick an ingest job off the request thread so a slow/rate-limited sync
    (Substack's jittered gaps, Playwright, large downloads) never blocks the HTTP
    response past a browser/Caddy timeout. The ingesters take non-blocking locks,
    so a one-shot firing while one is in flight just no-ops (coalesce collapses
    stacked triggers). Returns True if it was scheduled."""
    try:
        scheduler.add_job(_tracked(job_id), id=f"{job_id}_now", replace_existing=True,
                          max_instances=1, coalesce=True,
                          next_run_time=datetime.now(timezone.utc))
        return True
    except Exception:
        log.exception("could not schedule %s", job_id)
        return False


def _trigger_nyt_pull():
    _trigger_job("nyt")


def _trigger_mde():
    _trigger_job("mde")


def _trigger_youtube():
    _trigger_job("youtube")


def _safe_next(next_url: str | None, fallback: str = "/") -> str:
    """Only allow same-site relative redirect targets. Rejects protocol-relative
    (`//host`) and backslash (`/\\host`, which browsers normalize to `//host`)
    targets, and anything the URL parser reads as having a scheme or netloc."""
    if not next_url or not next_url.startswith("/") or next_url.startswith("//"):
        return fallback
    if "\\" in next_url or "\t" in next_url or "\n" in next_url or "\r" in next_url:
        return fallback
    p = urlsplit(next_url)
    if p.scheme or p.netloc:
        return fallback
    return next_url


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    auth.ensure_admin_user()
    # Interval jobs default to first-run = now + interval, so the hourly substack
    # job would only fire 60 min after boot — and a deploy restarts the app and
    # resets that countdown, so frequent deploys mean it may never run (and a
    # newly added cookie sits at "pending first sync"). Kick each job off shortly
    # after startup (staggered) so a fresh boot syncs within ~a minute.
    now = datetime.now(timezone.utc)
    kickoff = {"email": 30, "substack": 60, "patreon": 90, "podcasts": 130}  # seconds after boot
    scheduler.add_job(_tracked("email"), "interval",
                      minutes=config.EMAIL_POLL_MINUTES, id="email", max_instances=1,
                      coalesce=True, next_run_time=now + timedelta(seconds=kickoff["email"]))
    scheduler.add_job(_tracked("podcasts"), "interval",
                      minutes=config.PODCAST_POLL_MINUTES, id="podcasts", max_instances=1,
                      coalesce=True, next_run_time=now + timedelta(seconds=kickoff["podcasts"]))
    scheduler.add_job(_tracked("substack"), "interval",
                      minutes=config.SUBSTACK_POLL_MINUTES, id="substack", max_instances=1,
                      coalesce=True, next_run_time=now + timedelta(seconds=kickoff["substack"]))
    scheduler.add_job(_tracked("patreon"), "interval",
                      minutes=config.PATREON_POLL_MINUTES, id="patreon", max_instances=1,
                      coalesce=True, next_run_time=now + timedelta(seconds=kickoff["patreon"]))
    # NYT retries any rows still 'pulling' (e.g. left over from a crash/restart).
    scheduler.add_job(_tracked("nyt"), "interval",
                      minutes=config.NYT_POLL_MINUTES, id="nyt", max_instances=1,
                      coalesce=True, next_run_time=now + timedelta(seconds=150))
    # Periodic paid-content refresh: upgrade locked previews once an account pays
    # (upgrade-only, safe). Disabled when SUBSTACK_REFRESH_HOURS=0.
    if config.SUBSTACK_REFRESH_HOURS > 0:
        scheduler.add_job(_tracked("substack_refresh"), "interval",
                          hours=config.SUBSTACK_REFRESH_HOURS, id="substack_refresh",
                          max_instances=1, coalesce=True,
                          next_run_time=now + timedelta(seconds=200))
    # Verify who actually pays for what (real access test) — drives the /status
    # subscriptions breakdown AND the payer-priority fetch in sync_account (via
    # paid_json). Daily is plenty; also a manual "verify_paid" job. First run is
    # 6h after boot, NOT seconds like the jobs above: 12h/24h intervals anchored
    # to the same boot instant put verify's daily tick right after a refresh
    # tick FOREVER, and the refresh's rate-limited probes (plus the hourly sync)
    # hold the sync lock past SUBSTACK_LOCK_WAIT — verify was starved daily.
    # 6h is maximally far from the 12h refresh ticks.
    scheduler.add_job(_tracked("verify_paid"), "interval",
                      hours=24, id="verify_paid", max_instances=1, coalesce=True,
                      next_run_time=now + timedelta(hours=6))
    scheduler.add_job(_tracked("youtube"), "interval",
                      minutes=config.YOUTUBE_POLL_MINUTES, id="youtube",
                      max_instances=1, coalesce=True,
                      next_run_time=now + timedelta(seconds=110))
    # mde.tv: periodic sweep so any queued ('pending') download gets picked up
    # even if its on-demand trigger was dropped while another was in flight.
    scheduler.add_job(_tracked("mde"), "interval",
                      minutes=config.MDE_POLL_MINUTES, id="mde",
                      max_instances=1, coalesce=True,
                      next_run_time=now + timedelta(seconds=75))
    # mde.tv catalogue: slower poll that files any NEW episode under its show in
    # the shadow index and Discord-pings it (browse tab still lists live).
    scheduler.add_job(_tracked("mde_catalogue"), "interval",
                      minutes=config.MDE_CATALOGUE_MINUTES, id="mde_catalogue",
                      max_instances=1, coalesce=True,
                      next_run_time=now + timedelta(seconds=130))
    scheduler.start()
    log.info("Stackdock started. Feed: %s/feed/%s/all.xml", config.PUBLIC_BASE_URL, config.FEED_TOKEN)
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title=config.SITE_TITLE, lifespan=lifespan)
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.middleware("http")
async def csrf_guard(request: Request, call_next):
    """Reject state-changing requests that a browser marks as coming from another
    site. The app's real defense used to be only SameSite=Lax, which does NOT
    stop a SAME-SITE origin — and status.<domain> (uptime-kuma, admin claimed by
    whoever visits first) is same-site. Sec-Fetch-Site lets us block both
    same-site and cross-site POSTs while allowing our own forms (same-origin) and
    direct user actions (none). Absent header (old browsers) is allowed so we
    don't break them — the modern-browser attack surface is what matters."""
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        site = request.headers.get("sec-fetch-site")
        if site in ("cross-site", "same-site"):
            return JSONResponse({"detail": "cross-origin request blocked"},
                                status_code=403)
    return await call_next(request)


def _static_version() -> str:
    """Content hash of style.css, used as a ?v= cache-buster so a CSS change is
    fetched immediately (the service worker keys its cache by full URL, so a new
    hash dodges the stale stylesheet entirely)."""
    import hashlib
    try:
        return hashlib.md5((STATIC_DIR / "style.css").read_bytes()).hexdigest()[:10]
    except OSError:
        return "0"


STATIC_V = _static_version()


@app.get("/sw.js", include_in_schema=False)
def service_worker():
    """Service worker must be served from / so its scope can cover the whole app."""
    return FileResponse(STATIC_DIR / "sw.js", media_type="application/javascript",
                        headers={"Cache-Control": "no-cache"})


def render(request, template, **ctx):
    ctx.setdefault("site_title", config.SITE_TITLE)
    ctx.setdefault("static_v", STATIC_V)
    return templates.TemplateResponse(request, template, ctx)


@app.exception_handler(404)
async def not_found(request: Request, exc):
    """Custom 404 page for browser navigations; JSON for API/asset requests."""
    if "text/html" in request.headers.get("accept", ""):
        return templates.TemplateResponse(request, "404.html",
                                          {"site_title": config.SITE_TITLE}, status_code=404)
    return JSONResponse({"detail": getattr(exc, "detail", "Not Found")}, status_code=404)


@app.get("/healthz")
def healthz():
    return {"ok": True}


# ---------------- auth pages ----------------

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request, next: str = "/"):
    return render(request, "login.html", next=next, error=None)


@app.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...), next: str = Form("/")):
    user = db.get_user_by_name(username.strip())
    if not auth.check_login(user, password):
        return render(request, "login.html", next=next, error="Wrong username or password.")
    resp = RedirectResponse(_safe_next(next), status_code=303)
    auth.set_session_cookie(resp, user["id"])
    return resp


@app.post("/logout")
def logout():
    resp = RedirectResponse("/login", status_code=303)
    auth.clear_session_cookie(resp)
    return resp


@app.get("/signup", response_class=HTMLResponse)
def signup_page(request: Request, invite: str = ""):
    return render(request, "signup.html", invite=invite, error=None)


@app.post("/signup")
def signup(request: Request, invite: str = Form(...), username: str = Form(...),
           password: str = Form(...), password2: str = Form(...)):
    username = username.strip()
    def fail(msg):
        return render(request, "signup.html", invite=invite, error=msg)

    if len(username) < 2 or len(username) > 40:
        return fail("Username must be 2–40 characters.")
    if password != password2:
        return fail("Passwords don't match.")
    if len(password) < 8:
        return fail("Password must be at least 8 characters.")

    # Claim the invite and create the user atomically: a duplicate-username race
    # or concurrent invite claim rolls the whole thing back (invite stays
    # reusable) instead of 500ing on the UNIQUE constraint with the invite burnt.
    try:
        user_id = db.create_user_with_invite(
            username, auth.hash_password(password), invite.strip())
    except db.SignupError as e:
        return fail(str(e))
    resp = RedirectResponse("/", status_code=303)
    auth.set_session_cookie(resp, user_id)
    return resp


@app.get("/account", response_class=HTMLResponse)
def account_page(request: Request, user=Depends(auth.current_user)):
    return render(request, "account.html", user=user, message=None, error=None)


@app.post("/account/password")
def change_password(request: Request, user=Depends(auth.current_user),
                    current: str = Form(...), new: str = Form(...), new2: str = Form(...)):
    def page(message=None, error=None):
        return render(request, "account.html", user=user, message=message, error=error)
    if not auth.verify_password(current, user["password_hash"]):
        return page(error="Current password is wrong.")
    if new != new2:
        return page(error="New passwords don't match.")
    if len(new) < 8:
        return page(error="New password must be at least 8 characters.")
    db.set_password(user["id"], auth.hash_password(new))
    return page(message="Password updated.")


@app.get("/forgot", response_class=HTMLResponse)
def forgot_page(request: Request):
    return render(request, "forgot.html", done=False)


@app.post("/forgot")
def forgot(request: Request, username: str = Form(...)):
    # Only ping the channel for real accounts, but show the same message either way
    if db.get_user_by_name(username.strip()):
        notify.notify_reset_request(username.strip())
    return render(request, "forgot.html", done=True)


@app.get("/reset/{token}", response_class=HTMLResponse)
def reset_page(request: Request, token: str):
    return render(request, "reset.html", token=token, error=None)


@app.post("/reset/{token}")
def reset_password(request: Request, token: str, new: str = Form(...), new2: str = Form(...)):
    def fail(msg):
        return render(request, "reset.html", token=token, error=msg)
    if new != new2:
        return fail("Passwords don't match.")
    if len(new) < 8:
        return fail("Password must be at least 8 characters.")
    user_id = auth.redeem_reset_token(token)
    if not user_id:
        return fail("This reset link is invalid, expired, or already used. Ask the admin for a new one.")
    db.set_password(user_id, auth.hash_password(new))
    resp = RedirectResponse("/", status_code=303)
    auth.set_session_cookie(resp, user_id)
    return resp


# ---------------- admin ----------------

@app.get("/admin", response_class=HTMLResponse)
def admin_page(request: Request, user=Depends(auth.current_admin)):
    return render(request, "admin.html", user=user,
                  users=db.list_users(), invites=db.list_invites(),
                  new_invite=None, reset_link=None)


@app.post("/admin/invite")
def admin_invite(request: Request, user=Depends(auth.current_admin)):
    code = auth.new_invite_code()
    invite_link = f"{config.PUBLIC_BASE_URL}/signup?invite={code}"
    return render(request, "admin.html", user=user,
                  users=db.list_users(), invites=db.list_invites(),
                  new_invite=invite_link, reset_link=None)


@app.post("/admin/invite/delete")
def admin_invite_delete(user=Depends(auth.current_admin), code: str = Form(...)):
    db.delete_invite(code.strip())
    return RedirectResponse("/admin", status_code=303)


@app.post("/admin/invites/clear-used")
def admin_invites_clear_used(user=Depends(auth.current_admin)):
    db.clear_invites(only_used=True)
    return RedirectResponse("/admin", status_code=303)


@app.post("/admin/reset-link")
def admin_reset_link(request: Request, user=Depends(auth.current_admin), user_id: int = Form(...)):
    target = db.get_user(user_id)
    link = auth.new_reset_link(user_id) if target else None
    return render(request, "admin.html", user=user,
                  users=db.list_users(), invites=db.list_invites(),
                  new_invite=None,
                  reset_link={"username": target["username"], "url": link} if target else None)


@app.post("/admin/sync/{job}")
def manual_sync(job: str, user=Depends(auth.current_admin)):
    if job not in JOBS:
        raise HTTPException(404)
    # Offload to the scheduler: a full Substack sync sleeps 0.8-2.2s between
    # requests and can run for minutes — running it inline would tie up an HTTP
    # worker and blow past browser/Caddy timeouts. /status reflects the outcome.
    scheduled = _trigger_job(job)
    return {"job": job, "scheduled": scheduled}


# ---------------- connected accounts (substack) ----------------

def _accounts_ctx(user, error=None, message=None):
    return dict(user=user, accounts=db.list_accounts(user_id=user["id"]),
                tracked=db.list_tracked_publications(user_id=user["id"]),
                error=error, message=message)


@app.get("/accounts", response_class=HTMLResponse)
def accounts_page(request: Request, user=Depends(auth.current_user)):
    return render(request, "accounts.html", **_accounts_ctx(user))


@app.post("/accounts/add")
def accounts_add(request: Request, user=Depends(auth.current_user),
                 service: str = Form(...), cookie: str = Form(...),
                 handle: str = Form("")):
    service, cookie = service.strip(), cookie.strip()
    handle = handle.strip().lstrip("@")
    label = user["username"]          # the account is named after the member who added it
    def page(error=None, message=None):
        return render(request, "accounts.html", **_accounts_ctx(user, error, message))
    if service not in db.SERVICES:
        return page(error="Unknown service.")
    if not cookie:
        return page(error="The cookie value is required.")
    if len(cookie) < 20:
        return page(error="That doesn't look like a session cookie value.")
    if service == "substack" and not handle:
        return page(error="Your Substack username is required (it's in your profile URL: "
                          "substack.com/@yourhandle).")
    # one login can't be connected twice (e.g. someone pasting another member's cookie)
    owner = db.account_with_cookie(service, cookie)
    if owner and not (owner["user_id"] == user["id"] and owner["label"] == label):
        return page(error="That cookie is already connected to another account. "
                          "Each member connects their own login.")
    reconnect = db.account_exists(user["id"], service, label)
    db.add_account(user["id"], service, label, cookie, handle or None)
    # Substack only: best-effort reading-list-public check (full discovery needs
    # it — the cookie's own subscriptions API returns only a curated handful).
    public_note = ""
    if service == "substack":
        try:
            s = substack._session(cookie)
            if not substack.get_publications_via_profile(s, handle):
                public_note = (" ⚠️ We couldn't read your subscriptions from your public profile — "
                               "open Substack → Settings → Privacy and turn ON “Show reading list on "
                               "profile”, or we'll only see a partial list of what you follow.")
        except Exception:
            pass
    if reconnect:
        return page(message=f"Cookie for “{label}” refreshed. It keeps its sync history, so the "
                            "next sync only pulls new posts (no re-backfill, no Discord spam)." + public_note)
    return page(message=f"{service.capitalize()} account connected as “{label}”. It will backfill "
                        "on the next sync (or press Sync now below)." + public_note)


@app.post("/accounts/delete")
def accounts_delete(request: Request, user=Depends(auth.current_user),
                    account_id: int = Form(...)):
    db.delete_account(account_id, user["id"])
    return RedirectResponse("/accounts", status_code=303)


@app.post("/status/sync")
def status_sync(user=Depends(auth.current_user)):
    """Sync-now button on /status: kick the cookie syncs off the request thread
    (a full Substack sync runs for minutes) and land back on /status, which
    shows the outcome once each job records JOB_STATE."""
    for j in ("substack", "patreon"):
        _trigger_job(j)
    return RedirectResponse("/status", status_code=303)


@app.post("/accounts/sync")
def accounts_sync(request: Request, user=Depends(auth.current_user)):
    """Any member can trigger a sync of all connected accounts (Substack + Patreon).
    Offloaded to the scheduler so the response returns immediately instead of
    blocking on the (minutes-long, rate-limited) sync."""
    scheduled = [_trigger_job(j) for j in ("substack", "patreon")]
    msg = ("Sync started — new items will appear shortly; see Status for progress."
           if any(scheduled) else "Could not start sync — see Status for details.")
    return render(request, "accounts.html", **_accounts_ctx(user, message=msg))


@app.post("/follow")
def follow_toggle(request: Request, user=Depends(auth.current_user),
                  kind: str = Form(...), name: str = Form(...), back: str = Form("/")):
    if kind not in ("pub", "show") or not name.strip():
        raise HTTPException(400)
    db.toggle_follow(user["id"], kind, name.strip())
    return RedirectResponse(_safe_next(back), status_code=303)


@app.get("/audio/{slug}")
def audio_proxy(slug: str, user=Depends(auth.current_user)):
    """Same-origin audio stream. Playback uses presigned R2 URLs directly; this
    exists so the episode page's JS can fetch() the file into the offline cache
    (cross-origin presigned URLs are CORS-blocked for JS)."""
    e = db.get_episode_by_slug(slug)
    if not e:
        raise HTTPException(404)
    try:
        body, ctype, length = storage.open_stream(e["audio_key"])
    except Exception:
        raise HTTPException(503, "storage unavailable")

    def _stream():
        # close the R2 connection on normal completion AND on client abort
        # (Starlette calls .close() on the generator when the client disconnects)
        try:
            for chunk in iter(lambda: body.read(256 * 1024), b""):
                yield chunk
        finally:
            close = getattr(body, "close", None)
            if callable(close):
                close()

    headers = {"Cache-Control": "no-store"}
    if length:
        headers["Content-Length"] = str(length)
    return StreamingResponse(_stream(), media_type=e["audio_mime"] or ctype,
                             headers=headers)


@app.get("/media/{slug}")
def media_hls(slug: str, user=Depends(auth.current_user)):
    """Redirect to a freshly-signed HLS playlist for a Patreon video article. The
    browser's player streams the segments directly from Mux (CORS-open, signed);
    nothing is downloaded or proxied through us. The signed URL expires, so we mint
    a new one each play using a connected Patreon cookie."""
    a = db.get_article_by_slug(slug)
    if not a or not a["media_key"]:
        raise HTTPException(404)
    accts = db.list_accounts(service="patreon")
    accts.sort(key=lambda x: x["label"] != a["added_by"])   # prefer the article's own account
    for acc in accts:
        try:
            url = patreon.fresh_hls_url(acc["cookie"], a["media_key"])
        except Exception:
            url = None
        if url:
            return RedirectResponse(url, status_code=302)
    raise HTTPException(503, "video unavailable (no working Patreon connection)")


@app.get("/offline", response_class=HTMLResponse)
def offline_page(request: Request):
    """Self-contained saved-episodes player. Deliberately unauthenticated and
    precached by the service worker: it must render with no network at all.
    It contains NO server data — episodes/metadata come from the device's own
    Cache Storage and localStorage."""
    return render(request, "offline.html", user=None)


@app.get("/api/positions")
def api_positions(user=Depends(auth.current_user)):
    """Per-user listening positions — lets resume follow you across devices
    (and across Safari vs the installed home-screen app, which have separate
    local storage on iOS)."""
    return db.get_listen_positions(user["id"])


@app.post("/api/positions/{slug}")
async def api_save_position(slug: str, request: Request, user=Depends(auth.current_user)):
    """Accepts fetch() JSON or navigator.sendBeacon (text/plain blob)."""
    if not db.get_episode_by_slug(slug):
        raise HTTPException(404)
    try:
        data = json.loads((await request.body()) or b"{}")
        position = float(data.get("position", 0))
        duration = float(data.get("duration", 0))
        done = bool(data.get("done", False))
        override = bool(data.get("override", False))
    except (ValueError, TypeError):
        raise HTTPException(400, "bad payload")
    if position < 0 or position > 60 * 60 * 24 or duration < 0 or duration > 60 * 60 * 24:
        raise HTTPException(400, "out of range")
    db.upsert_listen_position(user["id"], slug, position, duration, done, override)
    return {"ok": True}


@app.post("/publications/add")
def publications_add(request: Request, user=Depends(auth.current_user),
                     name: str = Form(...), base_url: str = Form(...)):
    name, base_url = name.strip(), base_url.strip().rstrip("/")
    if not base_url.startswith("https://") or " " in base_url:
        return render(request, "accounts.html",
                      **_accounts_ctx(user, error="Publication URL must start with https://"))
    if not name:
        return render(request, "accounts.html",
                      **_accounts_ctx(user, error="Give the publication a display name."))
    if not db.add_tracked_publication(user["id"], name, base_url):
        return render(request, "accounts.html",
                      **_accounts_ctx(user, error="That publication URL is already tracked."))
    return render(request, "accounts.html",
                  **_accounts_ctx(user, message=f"Tracking {name}. It will pull in on the next sync."))


@app.post("/publications/delete")
def publications_delete(request: Request, user=Depends(auth.current_user),
                        pub_id: int = Form(...)):
    db.delete_tracked_publication(pub_id, user["id"])
    return RedirectResponse("/accounts", status_code=303)


# ---------------- content ----------------

PAGE_SIZE = 25


@app.get("/", response_class=HTMLResponse)
def index(request: Request, user=Depends(auth.current_user),
          pub: list[str] = Query(default=[]), show: list[str] = Query(default=[]),
          tab: str = "text", q: str | None = None, sort: str = "new", hidden: int = 0,
          sub: str = "articles", page: int = 1):
    q = (q or "").strip() or None
    sort = "old" if sort == "old" else "new"
    tab = tab if tab in ("text", "audio", "mine") else "text"
    mine_sub = sub if sub in ("articles", "podcasts") else "articles"
    show_hidden = bool(hidden)
    page = max(1, page)
    offset = (page - 1) * PAGE_SIZE
    active_pubs = [p for p in pub if p]          # multi-select publication filter
    active_shows = [s for s in show if s]        # multi-select podcast-show filter
    followed_pubs = db.list_follows(user["id"], "pub")
    followed_shows = db.list_follows(user["id"], "show")

    # tab badges show true totals (independent of the current page/filter)
    n_articles = db.count_articles()
    n_episodes = db.count_episodes()

    articles = episodes = []
    mine_articles = mine_episodes = []
    hidden_arts = hidden_eps = set()
    n_mine_articles = n_mine_episodes = n_mine_hidden = 0
    total = 0  # rows matching the active tab's filter, for the pager

    if tab == "text":
        pubs_filter = active_pubs or None
        total = db.count_articles(publications=pubs_filter, q=q, include_hidden=show_hidden)
        articles = db.list_articles(publications=pubs_filter, q=q, sort=sort,
                                    include_hidden=show_hidden, limit=PAGE_SIZE, offset=offset)
    elif tab == "audio":
        shows_filter = active_shows or None
        total = db.count_episodes(feeds=shows_filter)
        episodes = db.list_episodes(feeds=shows_filter, sort=sort, limit=PAGE_SIZE, offset=offset)
    else:  # mine — small, user-curated; hidden-filter then paginate in Python
        hidden_arts = db.list_hidden_refs(user["id"], "article")
        hidden_eps = db.list_hidden_refs(user["id"], "episode")
        arts = db.list_articles(publications=followed_pubs, q=q, sort=sort, limit=100000)
        eps = db.list_episodes(feeds=followed_shows, sort=sort, limit=100000)
        vis_arts = [a for a in arts if a["slug"] not in hidden_arts]
        vis_eps = [e for e in eps if e["slug"] not in hidden_eps]
        n_mine_articles, n_mine_episodes = len(vis_arts), len(vis_eps)
        if mine_sub == "articles":
            rows = arts if show_hidden else vis_arts
            n_mine_hidden = len(arts) - n_mine_articles
        else:
            rows = eps if show_hidden else vis_eps
            n_mine_hidden = len(eps) - n_mine_episodes
        total = len(rows)
        page_rows = rows[offset:offset + PAGE_SIZE]
        if mine_sub == "articles":
            mine_articles = page_rows
        else:
            mine_episodes = page_rows

    total_pages = max(1, -(-total // PAGE_SIZE))  # ceil
    return render(request, "index.html", user=user,
                  articles=articles,
                  publications=db.list_publications(),
                  active_pubs=active_pubs, q=q or "", sort=sort, show_hidden=show_hidden,
                  n_hidden=db.count_hidden_articles(),
                  active_tab=tab, mine_sub=mine_sub,
                  hidden_arts=hidden_arts, hidden_eps=hidden_eps,
                  n_articles=n_articles, n_episodes=n_episodes,
                  n_mine_articles=n_mine_articles, n_mine_episodes=n_mine_episodes,
                  n_mine_hidden=n_mine_hidden,
                  followed_pubs=followed_pubs, followed_shows=followed_shows,
                  mine_articles=mine_articles, mine_episodes=mine_episodes,
                  episodes=episodes,
                  episode_feeds=db.list_episode_feeds(),
                  active_shows=active_shows,
                  page=page, total_pages=total_pages, total_items=total,
                  feed_base=f"{config.PUBLIC_BASE_URL}/feed/{config.FEED_TOKEN}")


@app.post("/article/{article_id}/hide")
def hide_article(article_id: int, user=Depends(auth.current_admin), unhide: int = Form(0)):
    # This is a GLOBAL hide (no user_id column) — admin-only so one member can't
    # hide an article for everyone. Per-user hiding lives at /mine/hide.
    db.set_article_hidden(article_id, not unhide)
    return RedirectResponse(f"/?tab=text{'&hidden=1' if unhide else ''}", status_code=303)


@app.post("/mine/hide")
def hide_mine_item(user=Depends(auth.current_user), kind: str = Form(...),
                   ref: str = Form(...), back: str = Form("/?tab=mine"),
                   unhide: int = Form(0)):
    """Per-user hide/unhide of an article or episode in Your Stuff."""
    if kind not in ("article", "episode") or not ref.strip():
        raise HTTPException(400)
    db.set_hidden_item(user["id"], kind, ref.strip(), not unhide)
    return RedirectResponse(_safe_next(back, "/?tab=mine"), status_code=303)


@app.get("/read/{slug}", response_class=HTMLResponse)
def read_article(request: Request, slug: str, user=Depends(auth.current_user)):
    a = db.get_article_by_slug(slug)
    if not a:
        raise HTTPException(404)
    return render(request, "article.html", user=user, a=a,
                  sources=db.list_article_sources(a["id"]))


NYT_PAGE_SIZE = 10


@app.get("/nyt", response_class=HTMLResponse)
def nyt_page(request: Request, user=Depends(auth.current_user),
             page: int = 1, sort: str = "new", msg: str | None = None,
             err: str | None = None):
    sort = "old" if sort == "old" else "new"
    page = max(1, page)
    offset = (page - 1) * NYT_PAGE_SIZE
    total = db.count_nyt_articles()
    total_pages = max(1, -(-total // NYT_PAGE_SIZE))  # ceil
    return render(request, "nyt.html", user=user,
                  articles=db.list_nyt_articles(limit=NYT_PAGE_SIZE, offset=offset, sort=sort),
                  pending=db.recent_nyt_failures(), sort=sort,
                  page=page, total_pages=total_pages, total_items=total,
                  message=msg, error=err)


@app.post("/nyt/add")
def nyt_add(user=Depends(auth.current_user), url: str = Form(...)):
    url = (url or "").strip()
    if not nyt.is_nyt_url(url):
        return RedirectResponse("/nyt?err=Not+a+nytimes.com+URL", status_code=303)
    if nyt.is_live_blog(url):
        return RedirectResponse(
            "/nyt?err=Live+blogs+aren%27t+supported+yet+%28DataDome+device+check%29",
            status_code=303)
    row_id, created = db.insert_nyt_pending(url, user["username"])
    if not created:
        return RedirectResponse("/nyt?msg=Already+pulled+%E2%80%94+see+below", status_code=303)
    _trigger_nyt_pull()
    return RedirectResponse(
        "/nyt?msg=Pulling%E2%80%A6+refresh+in+a+moment", status_code=303)


@app.post("/nyt/sync")
def nyt_sync(user=Depends(auth.current_user)):
    """Member-facing 'check for pending pulls now' button."""
    _trigger_nyt_pull()
    return RedirectResponse("/nyt?msg=Checking+pending+pulls%E2%80%A6", status_code=303)


@app.get("/nyt/read/{slug}", response_class=HTMLResponse)
def nyt_read(request: Request, slug: str, user=Depends(auth.current_user)):
    a = db.get_nyt_article_by_slug(slug)
    if not a:
        raise HTTPException(404)
    return render(request, "nyt_article.html", user=user, a=a)


YT_PAGE_SIZE = 12


@app.get("/youtube", response_class=HTMLResponse)
def youtube_page(request: Request, user=Depends(auth.current_user),
                 page: int = 1, msg: str | None = None, err: str | None = None):
    page = max(1, page)
    offset = (page - 1) * YT_PAGE_SIZE
    total = db.count_youtube_videos()
    total_pages = max(1, -(-total // YT_PAGE_SIZE))
    return render(request, "youtube.html", user=user,
                  videos=db.list_youtube_videos(limit=YT_PAGE_SIZE, offset=offset),
                  channels=db.list_youtube_channels(),
                  page=page, total_pages=total_pages, total_items=total,
                  message=msg, error=err)


@app.post("/youtube/add-channel")
def youtube_add_channel(user=Depends(auth.current_user), url: str = Form(...)):
    handle = youtube.normalize_handle(url)
    if not handle:
        return RedirectResponse("/youtube?err=Not+a+YouTube+channel", status_code=303)
    _row_id, created = db.add_youtube_channel(handle, user["username"])
    if not created:
        return RedirectResponse("/youtube?msg=That+channel+is+already+tracked",
                                status_code=303)
    _trigger_youtube()
    return RedirectResponse(f"/youtube?msg=Added+%40{handle}+%E2%80%94+checking+for+uploads",
                            status_code=303)


@app.post("/youtube/remove-channel")
def youtube_remove_channel(user=Depends(auth.current_admin), channel_id: int = Form(...)):
    db.remove_youtube_channel(channel_id)
    return RedirectResponse("/youtube?msg=Channel+removed", status_code=303)


@app.post("/youtube/sync")
def youtube_sync(user=Depends(auth.current_user)):
    _trigger_youtube()
    return RedirectResponse("/youtube?msg=Checking+for+new+uploads%E2%80%A6", status_code=303)


@app.get("/youtube/watch/{slug}", response_class=HTMLResponse)
def youtube_watch(request: Request, slug: str, user=Depends(auth.current_user)):
    v = db.get_youtube_video_by_slug(slug)
    if not v:
        raise HTTPException(404)
    return render(request, "youtube_watch.html", user=user, v=v)


@app.get("/bussy-zone", response_class=HTMLResponse)
def bussy_zone(request: Request, user=Depends(auth.current_user)):
    # members (entered a valid card once) see the content page; everyone else the gate
    if user and db.is_bussy_member(user["id"]):
        return render(request, "bussy_content.html", user=user)
    # vanity "members joined": base offset so it reads 3 today (2 real unlocks
    # already) and ticks up by 1 with every purchase
    active_users = 1 + db.count_bussy_members()
    return render(request, "felix.html", user=user, active_users=active_users)


@app.post("/bussy-zone/unlock")
def bussy_unlock(user=Depends(auth.current_user)):
    # A valid-looking card prefix was entered client-side; we store NO card data,
    # just flag this member so future visits land on the content page.
    if not db.is_bussy_member(user["id"]):        # notify once, on first "purchase"
        db.set_bussy_member(user["id"])
        try:
            notify.notify_bussy_purchase(user["username"])
        except Exception:                          # noqa: BLE001 — never block on Discord
            pass
    return {"ok": True}


@app.get("/bussy-zone/checkout", response_class=HTMLResponse)
def bussy_checkout(request: Request, user=Depends(auth.current_user), plan: str = "annual"):
    # Client-side only: the page never POSTs card data anywhere — its JS gates on
    # ONLY the first 2 digits (card scheme), reading nothing else meaningfully.
    plans = {
        "monthly": {"name": "Bussy Pass — Monthly", "price": "2.00",
                    "sub": "🇺🇸 4th of July sale · billed monthly · cancel anytime"},
        "annual": {"name": "Bussy Pass — Annual", "price": "119.00",
                   "sub": "billed yearly · cancel anytime"},
        "lifetime": {"name": "Lifetime Vault", "price": "349.00",
                     "sub": "one-time · permanent access"},
    }
    p = plans.get((plan or "").lower(), plans["annual"])
    return render(request, "bussy_checkout.html", user=user, plan=p, plans=plans, plan_key=(plan or "annual").lower())


@app.get("/bussy-zone/bussy", response_class=HTMLResponse)
def bussy_win(request: Request, user=Depends(auth.current_user)):
    return render(request, "bussy_win.html", user=user)


@app.get("/mde", response_class=HTMLResponse)
def mde_page(request: Request, user=Depends(auth.current_user), err: str | None = None):
    # lazy: only hits mde.tv when someone opens the tab (cached thereafter)
    try:
        series = mde.list_series()
    except Exception as e:  # noqa: BLE001
        series, err = [], err or f"Couldn't reach mde.tv: {e}"
    return render(request, "mde.html", user=user, series=series, error=err)


@app.get("/mde/{tag}", response_class=HTMLResponse)
def mde_series(request: Request, tag: str, user=Depends(auth.current_user),
               msg: str | None = None, err: str | None = None):
    try:
        series, videos = mde.list_episodes(tag)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(404) from e
    status = db.mde_status_map([v.get("id") for v in videos if v.get("id")])
    return render(request, "mde_series.html", user=user, series=series,
                  videos=videos, status=status, message=msg, error=err)


@app.post("/mde/download")
def mde_download(user=Depends(auth.current_user), video_id: str = Form(...),
                 tag: str = Form(...)):
    try:
        v = mde.get_video(video_id)
    except Exception:  # noqa: BLE001
        return RedirectResponse(f"/mde/{tag}?err=Could+not+load+that+video", status_code=303)
    db.request_mde_download(
        video_id=video_id, series_tag=tag,
        series_name=v.get("series_name") or tag, title=v.get("title") or video_id,
        episode=v.get("episode"), duration=v.get("duration"),
        thumbnail=v.get("medium_thumbnail") or v.get("video_thumbnail") or "",
        added_by=user["username"])
    _trigger_mde()
    return RedirectResponse(f"/mde/{tag}?msg=Downloading%E2%80%A6+refresh+in+a+bit",
                            status_code=303)


@app.get("/mde/watch/{slug}", response_class=HTMLResponse)
def mde_watch(request: Request, slug: str, user=Depends(auth.current_user)):
    d = db.get_mde_download_by_slug(slug)
    if not d or d["status"] != "ready":
        raise HTTPException(404)
    try:
        src = storage.url_for(d["r2_key"])
    except Exception:  # noqa: BLE001
        src = None
    return render(request, "mde_watch.html", user=user, d=d, src=src)


@app.get("/listen/{slug}", response_class=HTMLResponse)
def listen_episode(request: Request, slug: str, user=Depends(auth.current_user)):
    e = db.get_episode_by_slug(slug)
    if not e:
        raise HTTPException(404)
    try:
        audio_url = storage.url_for(e["audio_key"])
        ext = e["audio_key"].rsplit(".", 1)[-1] if "." in e["audio_key"] else "mp3"
        download_url = storage.url_for(e["audio_key"], download_name=f"{e['slug']}.{ext}")
    except Exception:  # storage not configured (local dev) — page still renders
        audio_url = download_url = None
    return render(request, "episode.html", user=user, e=e,
                  audio_url=audio_url, download_url=download_url)


# Old numeric URLs keep working: redirect to the slug versions.

@app.get("/article/{article_id}")
def article_legacy(article_id: int, user=Depends(auth.current_user)):
    a = db.get_article(article_id)
    if not a:
        raise HTTPException(404)
    return RedirectResponse(f"/read/{a['slug']}", status_code=301)


@app.get("/episode/{episode_id}")
def episode_legacy(episode_id: int, user=Depends(auth.current_user)):
    e = db.get_episode(episode_id)
    if not e:
        raise HTTPException(404)
    return RedirectResponse(f"/listen/{e['slug']}", status_code=301)


@app.get("/status", response_class=HTMLResponse)
def status_page(request: Request, user=Depends(auth.current_user)):
    now = datetime.now(timezone.utc)

    jobs = []
    for j in scheduler.get_jobs():
        state = JOB_STATE.get(j.id, {})
        jobs.append({
            "id": j.id,
            "next_run": j.next_run_time.strftime("%H:%M UTC") if j.next_run_time else "—",
            "last_run": state.get("last_run").strftime("%Y-%m-%d %H:%M UTC") if state.get("last_run") else "not yet this boot",
            "result": state.get("result", "—"),
            "ok": state.get("ok", True),
        })

    # soft storage check — never let it break the page
    try:
        storage.client().head_bucket(Bucket=config.S3_BUCKET)
        storage_ok, storage_msg = True, f"bucket '{config.S3_BUCKET}' reachable"
    except Exception as e:
        storage_ok, storage_msg = False, f"{type(e).__name__}: {e}"

    du = shutil.disk_usage(config.DATA_DIR)
    accounts = db.list_accounts()

    # per-account subscription breakdown (who they follow / pay for) for /status.
    # "pays" merges the profile snapshot's paid flag with pubs the account has
    # demonstrably unlocked (catches paid subs a private reading list hides).
    account_subs = []
    for a in accounts:
        def _load(col):
            try:
                return json.loads(a[col]) if a[col] else []
            except (TypeError, ValueError, KeyError):
                return []
        subs = _load("subs_json")          # names the account subscribes to
        pays = set(_load("paid_json"))      # CONFIRMED paid (real access tested)
        sub_names = {s["name"] for s in subs} | pays
        free = sorted(n for n in sub_names if n not in pays)
        account_subs.append({
            "label": a["label"], "handle": a["handle"], "service": a["service"],
            "pays": sorted(pays), "free": free, "total": len(sub_names),
        })
    return render(request, "status.html", user=user,
                  r2=metrics.r2_metrics(),
                  do=metrics.do_metrics(),
                  nyt=metrics.nyt_metrics(),
                  nyt_counts=db.nyt_status_counts(),
                  nyt_failures=db.recent_nyt_failures(),
                  uptime=str(now - START_TIME).split(".")[0],
                  jobs=jobs,
                  storage_ok=storage_ok, storage_msg=storage_msg,
                  disk_used_pct=round(du.used / du.total * 100),
                  disk_free_gb=round(du.free / 1e9, 1),
                  accounts=accounts,
                  account_subs=account_subs,
                  github_repo=config.GITHUB_REPO,
                  github_workflows=config.GITHUB_WORKFLOWS,
                  n_articles=db.count_articles(),
                  n_episodes=db.count_episodes())


# ---- Token-protected podcast feed (no session: podcast apps need plain URLs) ----

@app.get("/feed/{token}/all.xml")
def feed_all(token: str):
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(), media_type="application/rss+xml")


@app.get("/feed/{token}/articles.xml")
def feed_articles(token: str):
    """Unified RSS of all mirrored article text, across every member's accounts."""
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_articles_feed(), media_type="application/rss+xml")


@app.get("/feed/{token}/everything.xml")
def feed_everything(token: str):
    """Articles + episodes merged into one feed, newest first."""
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_combined_feed(), media_type="application/rss+xml")


@app.get("/feed/{token}/show.xml")
def feed_show(token: str, name: str):
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(feed_filter=name), media_type="application/rss+xml")
