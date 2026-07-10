"""XSS sanitization of remote HTML + CSRF (Sec-Fetch-Site) guarding."""
import pytest
from fastapi.testclient import TestClient

from app import db
from app.main import app


@pytest.fixture
def auth_client(fresh_db):
    with TestClient(app) as c:
        c.post("/login", data={"username": "admin", "password": "admin-pass"})
        yield c


def test_article_body_script_is_stripped(auth_client):
    aid = db.insert_article(
        "m-xss", "Evil Pub", "Payload", "a", "https://evil.example/p/x",
        '<p>hello</p><script>window.__pwned=1</script>'
        '<img src=x onerror="window.__pwned=1">',
        "2026-01-01T00:00:00")
    slug = db.get_article(aid)["slug"]
    html = auth_client.get(f"/read/{slug}").text
    # scope to the rendered article body (the base template has its own legit
    # inline <script> for theming, so we can't assert on the whole page)
    body = html.split('<div class="body">', 1)[1].split("</article>", 1)[0]
    assert "hello" in body                        # legitimate content survives
    assert "<script" not in body.lower()          # script element gone
    assert "onerror" not in body.lower()          # event handler gone
    assert "__pwned" not in body


def test_article_javascript_url_neutralized(auth_client):
    aid = db.insert_article(
        "m-js", "Evil Pub", "JS URL", "a", "javascript:alert(1)",
        '<p><a href="javascript:alert(1)">click</a></p>', "2026-01-01T00:00:00")
    slug = db.get_article(aid)["slug"]
    html = auth_client.get(f"/read/{slug}").text
    assert "javascript:alert" not in html        # both the body link and the
    #                                              original-url href are neutralized


def test_csrf_blocks_cross_site_post(auth_client):
    # a browser marks a forged cross-origin POST with Sec-Fetch-Site: cross-site
    r = auth_client.post("/follow", data={"kind": "pub", "name": "X"},
                         headers={"Sec-Fetch-Site": "cross-site"},
                         follow_redirects=False)
    assert r.status_code == 403
    # ...and same-site too (the status.<domain> uptime-kuma subdomain vector)
    r = auth_client.post("/follow", data={"kind": "pub", "name": "X"},
                         headers={"Sec-Fetch-Site": "same-site"},
                         follow_redirects=False)
    assert r.status_code == 403


def test_csrf_allows_same_origin_and_absent(auth_client):
    # our own forms send same-origin; old browsers send nothing — both allowed
    r = auth_client.post("/follow", data={"kind": "pub", "name": "X"},
                         headers={"Sec-Fetch-Site": "same-origin"},
                         follow_redirects=False)
    assert r.status_code == 303
    r = auth_client.post("/follow", data={"kind": "pub", "name": "Y"},
                         follow_redirects=False)
    assert r.status_code == 303
