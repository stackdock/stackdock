"""Member radio: target resolution, worker flow, and the submit route."""
import pytest

from app import db, radio


def test_target_youtube_urls_pass_through():
    assert radio._target("https://www.youtube.com/watch?v=abc") == "https://www.youtube.com/watch?v=abc"
    assert radio._target("https://youtu.be/abc") == "https://youtu.be/abc"
    assert radio._target("https://music.youtube.com/watch?v=abc").startswith("https://music.")


def test_target_text_becomes_search():
    assert radio._target("purple rain prince") == "ytsearch1:purple rain prince"


def test_target_foreign_url_uses_page_title(monkeypatch):
    monkeypatch.setattr(radio, "_og_title", lambda u: "Song Name — Artist")
    assert radio._target("https://open.spotify.com/track/xyz") == "ytsearch1:Song Name — Artist"
    monkeypatch.setattr(radio, "_og_title", lambda u: None)
    with pytest.raises(RuntimeError, match="paste the song name"):
        radio._target("https://open.spotify.com/track/xyz")


def test_run_marks_ready_and_failed(fresh_db, monkeypatch):
    ok_id = db.add_radio_track("good song", "erin")
    bad_id = db.add_radio_track("bad song", "erin")

    def fake_download(query):
        if "bad" in query:
            raise RuntimeError("no YouTube result for that")
        return {"title": "Good Song", "artist": "Artist", "source_url": "https://yt/x",
                "audio_key": "radio/x.m4a", "duration": 200.0}

    monkeypatch.setattr(radio, "_download", fake_download)
    assert radio.run() == 1
    ok = db.get_radio_track(ok_id)
    assert (ok["status"], ok["title"], ok["duration"]) == ("ready", "Good Song", 200.0)
    bad = db.get_radio_track(bad_id)
    assert bad["status"] == "failed" and "no YouTube result" in bad["error"]
    assert [t["id"] for t in db.list_radio_tracks("ready")] == [ok_id]
    assert db.radio_source_exists("https://yt/x")


def test_submit_route_queues_and_triggers(client, monkeypatch):
    from app import auth, main
    triggered = []
    monkeypatch.setattr(main, "_trigger_job", lambda j: triggered.append(j) or True)
    db.create_user("m", auth.hash_password("pw12345678"))
    client.post("/login", data={"username": "m", "password": "pw12345678"})
    r = client.post("/radio/add", data={"query": "test song"}, follow_redirects=False)
    assert r.status_code == 303
    assert triggered == ["radio"]
    pending = db.radio_pending()
    assert len(pending) == 1 and pending[0]["added_by"] == "m"
    assert client.post("/radio/add", data={"query": "x"}).status_code == 400  # too short
