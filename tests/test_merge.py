"""Cross-source dedupe: a second account / email / cookie sighting of the same
post must merge into the existing row, never duplicate."""
from app import db


def _cookie_style(message_id="substack:42", **kw):
    base = dict(message_id=message_id, publication="Blog A", title="Big Post",
                author="Ann", original_url="https://bloga.substack.com/p/big-post",
                html="<p>full body text that is long</p>", published_at="2026-01-01T00:00:00")
    base.update(kw)
    return base


def test_url_match_ignores_utm_and_scheme(fresh_db):
    aid = db.insert_article(**_cookie_style())
    m = db.find_article_match(
        original_url="http://bloga.substack.com/p/big-post/?utm_source=substack&utm_medium=email")
    assert m and m["id"] == aid


def test_title_publication_match_when_no_url(fresh_db):
    # title fallback applies to NON-canonical rows (email/unknown sources)...
    aid = db.insert_article(**_cookie_style(message_id="<mail-1@x>", original_url=None))
    m = db.find_article_match(publication="blog a", title="BIG POST")
    assert m and m["id"] == aid
    assert db.find_article_match(publication="Blog B", title="Big Post") is None
    # ...but NEVER to canonical substack rows: recurring titles ("Open Thread")
    # must not absorb a genuinely new post into an old one
    db.insert_article(**_cookie_style(message_id="substack:77", title="Other Post",
                                      original_url=None))
    assert db.find_article_match(publication="Blog A", title="Other Post") is None


def test_absorb_fills_missing_and_adopts_guid(fresh_db):
    # email arrived first: email message-id, no cover, no author
    aid = db.insert_article(message_id="<abc@mail>", publication="Blog A", title="Big Post",
                            author=None, original_url=None, html='<p class="stub">link only</p>',
                            published_at=None)
    db.absorb_article(aid, message_id="substack:42", html="<p>the real full body</p>",
                      cover_image="https://cdn/c.png", author="Ann",
                      published_at="2026-01-01T00:00:00",
                      original_url="https://bloga.substack.com/p/big-post",
                      is_paid=True, source_label="Sam's account")
    row = db.get_article(aid)
    assert row["message_id"] == "substack:42"        # canonical id adopted
    assert row["html"] == "<p>the real full body</p>"
    assert row["is_locked"] == 0 and row["is_paid"] == 1
    assert row["cover_image"] and row["author"] == "Ann" and row["original_url"]
    assert "Sam's account" in db.list_article_sources(aid)
    # future cookie syncs now hit the fast path
    assert db.get_article_by_message_id("substack:42")["id"] == aid


def test_absorb_never_downgrades(fresh_db):
    aid = db.insert_article(**_cookie_style(cover_image="https://cdn/orig.png"))
    db.absorb_article(aid, message_id="substack:42", html=None,
                      cover_image="https://cdn/other.png", author="Bob",
                      source_label="second account")
    row = db.get_article(aid)
    assert row["cover_image"] == "https://cdn/orig.png"  # existing wins
    assert row["author"] == "Ann"                        # not overwritten
    assert row["html"] == "<p>full body text that is long</p>"
    assert sorted(db.list_article_sources(aid))[-1] == "second account"
