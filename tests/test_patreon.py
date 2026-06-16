"""Patreon ingest: ProseMirror render + post->article mapping/dedupe (fake stream)."""
import json

import pytest

from app import db
from app.ingest import patreon


def test_prosemirror_renders_to_html():
    doc = {"type": "doc", "content": [
        {"type": "heading", "attrs": {"level": 2},
         "content": [{"type": "text", "text": "Title"}]},
        {"type": "paragraph", "content": [
            {"type": "text", "text": "Hello "},
            {"type": "text", "text": "bold", "marks": [{"type": "bold"}]},
            {"type": "text", "text": " and "},
            {"type": "text", "text": "link",
             "marks": [{"type": "link", "attrs": {"href": "https://x.test"}}]}]},
        {"type": "bulletList", "content": [
            {"type": "listItem", "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "item"}]}]}]},
    ]}
    html = patreon._pm_to_html(doc)
    assert "<h2>Title</h2>" in html
    assert "<strong>bold</strong>" in html
    assert '<a href="https://x.test"' in html and ">link</a>" in html
    assert "<ul><li><p>item</p></li></ul>" in html


def _post(pid, title, is_paid, can_view, ptype="text_only"):
    return {"id": pid, "type": "post",
            "attributes": {"title": title, "is_paid": is_paid,
                           "current_user_can_view": can_view, "post_type": ptype,
                           "published_at": "2026-06-01T00:00:00.000+00:00",
                           "url": f"https://www.patreon.com/posts/{pid}"},
            "relationships": {"campaign": {"data": {"id": "c1", "type": "campaign"}}}}


def _stream():
    return ([_post("1", "Free One", False, True),
             _post("2", "Paid Open", True, True),
             _post("3", "Paid Locked", True, False),
             _post("4", "Video One", False, True, ptype="video_external_file")],
            {"c1": "Frienji"})


def _doc(text):
    return json.dumps({"type": "doc", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": text}]}]})


@pytest.fixture
def world(fresh_db, monkeypatch):
    bodies = {"1": _doc("Free full body"), "2": _doc("Paid full body"),
              "4": _doc("Video recipe text")}
    monkeypatch.setattr(patreon, "_authenticated", lambda s: True)
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: _stream())
    monkeypatch.setattr(patreon, "_post_detail",
                        lambda s, pid: {"content_json_string": bodies.get(pid)})
    monkeypatch.setattr(patreon.time, "sleep", lambda *_: None)
    monkeypatch.setattr(patreon.notify, "flush", lambda: None)


def test_patreon_pulls_full_body_and_flags(world):
    new, status = patreon.sync_account({"cookie": "sess-cookie-long-enough",
                                        "label": "erin", "last_sync": None})
    assert new == 4
    arts = {a["title"]: db.get_article_by_slug(a["slug"])
            for a in db.list_articles(publications=["Frienji"])}
    assert (arts["Free One"]["is_paid"], arts["Free One"]["is_locked"]) == (0, 0)
    assert "Free full body" in arts["Free One"]["html"]          # full body, not a stub
    assert "Paid full body" in arts["Paid Open"]["html"]
    assert (arts["Paid Locked"]["is_paid"], arts["Paid Locked"]["is_locked"]) == (1, 1)
    assert "Read on Patreon" in arts["Paid Locked"]["html"]       # locked -> stub
    assert arts["Video One"]["media_key"] == "4"                  # playable inline via /media
    assert "Video recipe text" in arts["Video One"]["html"]       # video posts carry their text too
    pubs = {p["publication"]: p["paid"] for p in db.list_publications()}
    assert pubs.get("Frienji") == 1                               # Patreon pubs are always green/paid


def test_patreon_upgrades_stub_body_on_resync(world):
    # an article stored earlier as a stub gets its full body on the next sync
    db.insert_article("patreon:1", "Frienji", "Free One", "Frienji", "https://x",
                      '<p class="stub"><a href="https://x">Read on Patreon →</a></p>',
                      "2026-06-01", added_by="erin", notified=1)
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    row = next(x for x in db.list_articles(publications=["Frienji"]) if x["title"] == "Free One")
    a = db.get_article_by_slug(row["slug"])
    assert "Free full body" in a["html"] and "Read on Patreon" not in a["html"]
