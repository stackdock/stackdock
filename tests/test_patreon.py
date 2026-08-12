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
    monkeypatch.setattr(patreon, "fetch_campaign_posts", lambda s, cid, n: [])
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


def test_gated_post_with_false_is_paid_flag_stores_as_locked(world, monkeypatch):
    # Patreon reports is_paid=false on patron-gated posts (it means pay-per-post,
    # not "gated") — anything we can't view must badge paid+locked, not free.
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: (
        [_post("9", "Gated Video", False, False, ptype="video_external_file")],
        {"c1": "Frienji"}))
    patreon.sync_account({"cookie": "c", "label": "erin", "last_sync": None})
    row = next(x for x in db.list_articles(publications=["Frienji"]))
    a = db.get_article_by_slug(row["slug"])
    assert (a["is_paid"], a["is_locked"]) == (1, 1)
    assert a["media_key"] is None                      # not playable while locked
    assert "Watch this video on Patreon" in a["html"]


def test_campaign_back_catalog_backfills_once_and_silently(world, monkeypatch):
    # Old posts never surface in the stream — the per-campaign sweep mirrors them
    # (silently), marks the campaign done, and doesn't re-sweep next sync.
    calls = []

    def catalog(s, cid, n):
        calls.append(cid)
        # real /api/posts catalog entries carry NO relationships block unless
        # include=campaign is sent — the ingester must still attribute them to
        # the swept campaign, not the "Patreon" fallback
        bare = [_post("old1", "Ancient Report", False, True),
                _post("old2", "Ancient Gated", False, False)]
        for p in bare:
            p.pop("relationships")
        return bare

    monkeypatch.setattr(patreon, "fetch_campaign_posts", catalog)
    new, status = patreon.sync_account({"cookie": "c", "label": "erin",
                                        "last_sync": "2026-01-01T00:00:00+00:00"})
    assert calls == ["c1"]
    assert "back catalog" in status
    titles = {a["title"] for a in db.list_articles(publications=["Frienji"])}
    assert {"Ancient Report", "Ancient Gated"} <= titles
    old2 = next(a for a in db.list_articles(publications=["Frienji"])
                if a["title"] == "Ancient Gated")
    assert (old2["is_paid"], old2["is_locked"]) == (1, 1)
    # backfilled rows are silent: nothing from the catalog queued for the digest
    pending = {i["title"] for i in db.list_unnotified_items()}
    assert not {"Ancient Report", "Ancient Gated"} & pending
    # second sync: campaign already swept -> no re-fetch
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    assert calls == ["c1"]
    # a fresh marker suppresses the sweep; a stale one (0-day max age) re-arms it
    assert not db.patreon_campaign_needs_backfill("c1", 7)
    assert db.patreon_campaign_needs_backfill("c1", 0)


def test_resweep_heals_fallback_named_rows(world, monkeypatch):
    # rows stored under the "Patreon" fallback publication get re-homed to the
    # campaign name when a sweep sees them again
    db.insert_article("patreon:old1", "Patreon", "Ancient Report", "Patreon",
                      "https://www.patreon.com/posts/old1", "<p>" + "x" * 300 + "</p>",
                      "2026-06-01", added_by="erin", notified=1)
    monkeypatch.setattr(patreon, "fetch_campaign_posts",
                        lambda s, cid, n: [_post("old1", "Ancient Report", False, True)])
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    a = db.get_article_by_message_id("patreon:old1")
    assert a["publication"] == "Frienji" and a["author"] == "Frienji"


PROMO = ("You're currently on the free tier, which doesn't show full videos. "
         "By joining the paid tier, you can now watch the full MAN report right here!")


def test_free_tier_promo_posts_are_hidden_and_silent(world, monkeypatch):
    # a free-tier account "can view" the post, but the served body is a
    # membership ad — store it hidden+locked and never queue it for the digest
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: (
        [_post("7", "watch the full report!!", False, True)], {"c1": "Frienji"}))
    monkeypatch.setattr(patreon, "_post_detail",
                        lambda s, pid: {"content_json_string": _doc(PROMO)})
    new, _ = patreon.sync_account({"cookie": "c", "label": "erin",
                                   "last_sync": "2026-01-01T00:00:00+00:00"})
    assert new == 0
    assert not list(db.list_articles(publications=["Frienji"]))
    a = db.get_article_by_message_id("patreon:7")
    assert (a["hidden"], a["is_locked"], a["is_paid"]) == (1, 1, 1)
    assert not db.list_unnotified_items()
    # a resync serving the same ad neither unhides nor "upgrades" the body
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    a = db.get_article_by_message_id("patreon:7")
    assert (a["hidden"], a["is_locked"]) == (1, 1)


def test_promo_row_unhides_when_real_body_arrives(world, monkeypatch):
    # once a paying account's sync serves the actual content, the promo-hidden
    # row is upgraded in place and surfaced
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: (
        [_post("7", "watch the full report!!", False, True)], {"c1": "Frienji"}))
    monkeypatch.setattr(patreon, "_post_detail",
                        lambda s, pid: {"content_json_string": _doc(PROMO)})
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    monkeypatch.setattr(patreon, "_post_detail",
                        lambda s, pid: {"content_json_string": _doc("The actual chapter text")})
    patreon.sync_account({"cookie": "c2", "label": "payer",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    a = db.get_article_by_message_id("patreon:7")
    assert (a["hidden"], a["is_locked"]) == (0, 0)
    assert "actual chapter text" in a["html"]


def test_admin_hidden_row_stays_hidden_on_upgrade(world, monkeypatch):
    # an admin-hidden row (body is NOT a promo) must not resurface when a sync
    # touches it with fresh content
    db.insert_article("patreon:8", "Frienji", "Junk", "Frienji", "https://x",
                      '<p class="stub"><a href="https://x">Read on Patreon →</a></p>',
                      "2026-06-01", added_by="erin", notified=1)
    db.set_article_hidden(db.get_article_by_message_id("patreon:8")["id"], True)
    monkeypatch.setattr(patreon, "fetch_stream", lambda s, n: (
        [_post("8", "Junk", False, True)], {"c1": "Frienji"}))
    monkeypatch.setattr(patreon, "_post_detail",
                        lambda s, pid: {"content_json_string": _doc("Fresh body text")})
    patreon.sync_account({"cookie": "c", "label": "erin",
                          "last_sync": "2026-01-01T00:00:00+00:00"})
    a = db.get_article_by_message_id("patreon:8")
    assert a["hidden"] == 1 and "Fresh body text" in a["html"]


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
