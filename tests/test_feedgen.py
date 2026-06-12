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
