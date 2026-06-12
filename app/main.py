"""Stackdock — personal newsletter & podcast mirror."""
import logging
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import config, db, feedgen, storage
from .ingest import email_ingest, gumroad, podcast_rss

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("stackdock")

security = HTTPBasic()
templates = Jinja2Templates(directory=Path(__file__).parent / "templates")

scheduler = BackgroundScheduler()


def require_auth(credentials: HTTPBasicCredentials = Depends(security)):
    user_ok = secrets.compare_digest(credentials.username, config.BASIC_AUTH_USER)
    pass_ok = secrets.compare_digest(credentials.password, config.BASIC_AUTH_PASS)
    if not (user_ok and pass_ok):
        raise HTTPException(status_code=401, headers={"WWW-Authenticate": "Basic"})
    return credentials.username


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    scheduler.add_job(email_ingest.run, "interval", minutes=config.EMAIL_POLL_MINUTES,
                      id="email", max_instances=1, coalesce=True)
    scheduler.add_job(podcast_rss.run, "interval", minutes=config.PODCAST_POLL_MINUTES,
                      id="podcasts", max_instances=1, coalesce=True)
    scheduler.add_job(gumroad.run, "interval", minutes=config.GUMROAD_POLL_MINUTES,
                      id="gumroad", max_instances=1, coalesce=True)
    scheduler.start()
    log.info("Stackdock started. Feed: %s/feed/%s/all.xml", config.PUBLIC_BASE_URL, config.FEED_TOKEN)
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title=config.SITE_TITLE, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/", response_class=HTMLResponse)
def index(request: Request, user: str = Depends(require_auth)):
    articles = db.list_articles()
    episodes = db.list_episodes(limit=100)
    return templates.TemplateResponse(request, "index.html", {
        "site_title": config.SITE_TITLE,
        "articles": articles,
        "episodes": episodes,
        "feed_url": f"{config.PUBLIC_BASE_URL}/feed/{config.FEED_TOKEN}/all.xml",
    })


@app.get("/article/{article_id}", response_class=HTMLResponse)
def article(request: Request, article_id: int, user: str = Depends(require_auth)):
    a = db.get_article(article_id)
    if not a:
        raise HTTPException(404)
    return templates.TemplateResponse(request, "article.html", {
        "site_title": config.SITE_TITLE, "a": a,
    })


@app.get("/episode/{episode_id}")
def episode(episode_id: int, user: str = Depends(require_auth)):
    e = db.get_episode(episode_id)
    if not e:
        raise HTTPException(404)
    return RedirectResponse(storage.url_for(e["audio_key"]))


# ---- Token-protected podcast feed (no basic auth: podcast apps need plain URLs) ----

@app.get("/feed/{token}/all.xml")
def feed_all(token: str):
    if not secrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(), media_type="application/rss+xml")


@app.get("/feed/{token}/show.xml")
def feed_show(token: str, name: str):
    if not secrets.compare_digest(token, config.FEED_TOKEN):
        raise HTTPException(404)
    return Response(content=feedgen.build_feed(feed_filter=name), media_type="application/rss+xml")


# ---- Manual triggers (handy while setting up) ----

@app.post("/admin/sync/{job}")
def manual_sync(job: str, user: str = Depends(require_auth)):
    jobs = {"email": email_ingest.run, "podcasts": podcast_rss.run, "gumroad": gumroad.run}
    if job not in jobs:
        raise HTTPException(404)
    count = jobs[job]()
    return {"job": job, "new_items": count}
