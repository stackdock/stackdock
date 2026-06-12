"""Stackdock — personal newsletter & podcast mirror (multi-user)."""
import logging
import secrets as pysecrets
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, Form, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import auth, config, db, feedgen, notify, storage
from .ingest import email_ingest, gumroad, podcast_rss, substack

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("stackdock")

templates = Jinja2Templates(directory=Path(__file__).parent / "templates")
scheduler = BackgroundScheduler()


def _safe_next(next_url: str | None) -> str:
    """Only allow same-site relative redirect targets."""
    if next_url and next_url.startswith("/") and not next_url.startswith("//"):
        return next_url
    return "/"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    auth.ensure_admin_user()
    scheduler.add_job(email_ingest.run, "interval", minutes=config.EMAIL_POLL_MINUTES,
                      id="email", max_instances=1, coalesce=True)
    scheduler.add_job(podcast_rss.run, "interval", minutes=config.PODCAST_POLL_MINUTES,
                      id="podcasts", max_instances=1, coalesce=True)
    scheduler.add_job(gumroad.run, "interval", minutes=config.GUMROAD_POLL_MINUTES,
                      id="gumroad", max_instances=1, coalesce=True)
    scheduler.add_job(substack.run, "interval", minutes=config.SUBSTACK_POLL_MINUTES,
                      id="substack", max_instances=1, coalesce=True)
    scheduler.start()
    log.info("Stackdock started. Feed: %s/feed/%s/all.xml", config.PUBLIC_BASE_URL, config.FEED_TOKEN)
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title=config.SITE_TITLE, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")


def render(request, template, **ctx):
    ctx.setdefault("site_title", config.SITE_TITLE)
    return templates.TemplateResponse(request, template, ctx)


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
    if not user or not auth.verify_password(password, user["password_hash"]):
        return render(request, "login.html", next=next, error="Wrong username or password.")
    resp = RedirectResponse(_safe_next(next), status_code=303)
    auth.set_session_cookie(resp, user["id"])
    return resp


@app.get("/logout")
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
    if db.get_user_by_name(username):
        return fail("That username is taken.")
    if not db.consume_invite(invite.strip(), username):
        return fail("Invalid or already-used invite code.")

    user_id = db.create_user(username, auth.hash_password(password))
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
    jobs = {"email": email_ingest.run, "podcasts": podcast_rss.run,
            "gumroad": gumroad.run, "substack": substack.run}
    if job not in jobs:
        raise HTTPException(404)
    return {"job": job, "new_items": jobs[job]()}


# ---------------- connected accounts (substack + gumroad) ----------------

@app.get("/accounts", response_class=HTMLResponse)
def accounts_page(request: Request, user=Depends(auth.current_user)):
    return render(request, "accounts.html", user=user,
                  accounts=db.list_accounts(user_id=user["id"]), error=None, message=None)


@app.post("/accounts/add")
def accounts_add(request: Request, user=Depends(auth.current_user),
                 service: str = Form(...), label: str = Form(...), cookie: str = Form(...)):
    service, label, cookie = service.strip(), label.strip(), cookie.strip()
    def page(error=None, message=None):
        return render(request, "accounts.html", user=user,
                      accounts=db.list_accounts(user_id=user["id"]), error=error, message=message)
    if service not in db.SERVICES:
        return page(error="Unknown service.")
    if not label or not cookie:
        return page(error="Both a label and the cookie value are required.")
    if len(cookie) < 20:
        return page(error="That doesn't look like a session cookie value.")
    db.add_account(user["id"], service, label, cookie)
    return page(message=f"{service.capitalize()} account connected. It will backfill on the "
                        "next sync (or press Sync now below).")


@app.post("/accounts/delete")
def accounts_delete(request: Request, user=Depends(auth.current_user),
                    account_id: int = Form(...)):
    db.delete_account(account_id, user["id"])
    return RedirectResponse("/accounts", status_code=303)


@app.post("/accounts/sync")
def accounts_sync(request: Request, user=Depends(auth.current_user)):
    """Any member can trigger a sync of all connected accounts (both services)."""
    count = substack.run() + gumroad.run()
    return render(request, "accounts.html", user=user,
                  accounts=db.list_accounts(user_id=user["id"]),
                  error=None, message=f"Sync finished: {count} new item(s).")


# ---------------- content ----------------

@app.get("/", response_class=HTMLResponse)
def index(request: Request, user=Depends(auth.current_user), pub: str | None = None):
    return render(request, "index.html", user=user,
                  articles=db.list_articles(publication=pub),
                  publications=db.list_publications(),
                  active_pub=pub,
                  episodes=db.list_episodes(limit=100),
                  feed_url=f"{config.PUBLIC_BASE_URL}/feed/{config.FEED_TOKEN}/all.xml")


@app.get("/article/{article_id}", response_class=HTMLResponse)
def article(request: Request, article_id: int, user=Depends(auth.current_user)):
    a = db.get_article(article_id)
    if not a:
        raise HTTPException(404)
    return render(request, "article.html", user=user, a=a)


@app.get("/episode/{episode_id}")
def episode(episode_id: int, user=Depends(auth.current_user)):
    e = db.get_episode(episode_id)
    if not e:
        raise HTTPException(404)
    return RedirectResponse(storage.url_for(e["audio_key"]))


# ---- Token-protected podcast feed (no session: podcast apps need plain URLs) ----

@app.get("/feed/{token}/all.xml")
def feed_all(token: str):
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(), media_type="application/rss+xml")


@app.get("/feed/{token}/show.xml")
def feed_show(token: str, name: str):
    if not pysecrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(feed_filter=name), media_type="application/rss+xml")
