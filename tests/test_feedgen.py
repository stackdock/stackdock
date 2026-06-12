"""Private podcast RSS generation produces well-formed XML."""
import xml.etree.ElementTree as ET

from app import db, feedgen


def test_empty_feed_is_valid_rss(fresh_db):
    xml = feedgen.build_feed()
    root = ET.fromstring(xml)  # raises if malformed
    assert root.tag == "rss"
    assert root.find("channel") is not None


def test_feed_includes_an_episode(fresh_db, monkeypatch):
    # episodes carry an enclosure URL built from storage.url_for
    from app import storage
    monkeypatch.setattr(storage, "url_for", lambda key: f"https://cdn.test/{key}")

    db.insert_episode(
        guid="guid-1", feed_name="My Show", title="Ep 1",
        description="hello", audio_key="audio/ep1.mp3",
        audio_bytes=1234, audio_mime="audio/mpeg",
        duration=None, published_at="2026-01-01T00:00:00+00:00",
    )
    xml = feedgen.build_feed()
    root = ET.fromstring(xml)
    titles = [t.text for t in root.iter("title")]
    assert "Ep 1" in titles
    assert "audio/ep1.mp3" in xml


def test_articles_feed_aggregates_publications(fresh_db):
    db.insert_article("m1", "Blog A", "Post One", "x", "http://a/1", "<p>body one</p>", "2026-01-02T00:00:00+00:00")
    db.insert_article("m2", "Blog B", "Post Two", "y", "http://b/2", "<p>body two</p>", "2026-01-01T00:00:00+00:00")
    xml = feedgen.build_articles_feed()
    root = ET.fromstring(xml)
    titles = [t.text for t in root.iter("title")]
    assert "Post One" in titles and "Post Two" in titles
    assert "body one" in xml  # full content travels in the feed
    assert "/read/post-one" in xml  # slug URLs


def test_combined_feed_merges_and_sorts(fresh_db, monkeypatch):
    from app import storage
    monkeypatch.setattr(storage, "url_for", lambda key: f"https://cdn.test/{key}")
    db.insert_article("m1", "Blog A", "Older Post", "x", None, "<p>x</p>", "2026-01-01T00:00:00+00:00")
    db.insert_episode("g1", "Show", "Newer Ep", "d", "k.mp3", 1, "audio/mpeg", "", "2026-01-05T00:00:00+00:00")
    xml = feedgen.build_combined_feed()
    root = ET.fromstring(xml)
    item_titles = [i.find("title").text for i in root.iter("item")]
    assert item_titles == ["Newer Ep", "Older Post"]  # newest first, both kinds
    assert "<enclosure" in xml
