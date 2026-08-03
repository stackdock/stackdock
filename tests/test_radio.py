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


def _ready(title, **kw):
    tid = db.add_radio_track(kw.get("query", title), kw.get("by", "erin"))
    db.radio_set_ready(tid, title=title, artist="A", source_url=f"https://yt/{tid}",
                       audio_key=f"radio/{tid}.m4a", duration=100.0)
    return tid


def test_reorder_moves_tracks_and_stops_at_the_ends(fresh_db):
    a, b, c = _ready("A"), _ready("B"), _ready("C")
    order = lambda: [t["title"] for t in db.list_radio_tracks("ready")]
    assert order() == ["A", "B", "C"]
    assert db.radio_move(c, -1) and order() == ["A", "C", "B"]
    assert db.radio_move(a, 1) and order() == ["C", "A", "B"]
    assert not db.radio_move(order_id(db, "C"), -1)          # already first
    assert not db.radio_move(order_id(db, "B"), 1)           # already last
    assert order() == ["C", "A", "B"]                        # unchanged on refusal
    assert not db.radio_move(9999, 1)                        # unknown id
    assert b                                                  # (silence linters)


def order_id(dbmod, title):
    return next(t["id"] for t in dbmod.list_radio_tracks("ready") if t["title"] == title)


def test_reorder_survives_deletion_of_a_middle_track(fresh_db):
    a, b, c = _ready("A"), _ready("B"), _ready("C")
    db.radio_move(c, -1)                    # A C B  (positions now dense)
    db.delete_radio_track(order_id(db, "C"))
    assert [t["title"] for t in db.list_radio_tracks("ready")] == ["A", "B"]
    assert db.radio_move(b, -1)
    assert [t["title"] for t in db.list_radio_tracks("ready")] == ["B", "A"]
    assert a


def test_station_advances_track_by_track(fresh_db, monkeypatch):
    for t in ("A", "B", "C"):
        _ready(t)                                    # 100s each
    clock = {"t": 1000.0}
    monkeypatch.setattr(radio.time, "time", lambda: clock["t"])
    st = radio.station_now()
    assert st["track"]["title"] == "A" and st["offset"] < 1
    clock["t"] += 40
    assert 39 < radio.station_now()["offset"] < 41           # same track, later
    clock["t"] += 70                                          # past A's end
    st = radio.station_now()
    assert st["track"]["title"] == "B" and st["offset"] < 15
    clock["t"] += 100_000                                     # long outage
    assert radio.station_now() is not None                    # rejoins, no spin


def test_a_played_track_graduates_into_the_shuffled_catalogue(fresh_db, monkeypatch):
    a, b = _ready("A"), _ready("B")
    clock = {"t": 500.0}
    monkeypatch.setattr(radio.time, "time", lambda: clock["t"])
    radio.station_now()                                       # A on air
    assert not db.get_radio_track(a)["aired_at"]              # not yet finished
    clock["t"] += 101                                         # A finishes
    assert radio.station_now()["track"]["title"] == "B"
    assert db.get_radio_track(a)["aired_at"]                  # graduated
    assert [t["id"] for t in radio.station_order() if not t["aired_at"]] == [b]


def test_playing_a_pinned_track_consumes_the_pin(fresh_db, monkeypatch):
    a, b = _ready("A"), _ready("B")
    db.radio_promote(b, True)                                 # B jumps the queue
    clock = {"t": 900.0}
    monkeypatch.setattr(radio.time, "time", lambda: clock["t"])
    assert radio.station_now()["track"]["title"] == "B"
    clock["t"] += 101
    radio.station_now()
    assert db.get_radio_track(b)["promoted_at"] is None       # pin spent
    assert a


def test_vote_skip_advances_the_station_for_everyone(fresh_db, monkeypatch):
    for t in ("A", "B", "C"):
        _ready(t)
    monkeypatch.setattr(radio.time, "time", lambda: 10.0)
    assert radio.station_now()["track"]["title"] == "A"
    radio.station_skip()                                      # a passed vote
    after = radio.station_now()
    assert after["track"]["title"] == "B" and after["offset"] < 1


def test_reordering_never_yanks_the_song_on_air(fresh_db, monkeypatch):
    a, b, c = _ready("A"), _ready("B"), _ready("C")
    clock = {"t": 2000.0}
    monkeypatch.setattr(radio.time, "time", lambda: clock["t"])
    radio.station_now()
    clock["t"] += 30
    on_air = radio.station_now()["track"]["title"]
    db.radio_promote(c, True)                                 # playlist changes mid-song
    _ready("D")
    still = radio.station_now()
    assert still["track"]["title"] == on_air                  # same song...
    assert 29 < still["offset"] < 32                          # ...same position
    assert a and b


def test_vote_threshold_is_a_majority_of_listeners():
    assert radio.votes_needed(0) == 1        # solo listener can skip
    assert radio.votes_needed(1) == 1
    assert radio.votes_needed(2) == 2
    assert radio.votes_needed(3) == 2
    assert radio.votes_needed(6) == 4


def test_votes_are_scoped_to_one_airing(fresh_db):
    tid = _ready("A")
    assert db.radio_vote(1, tid, cycle=0) == 1
    assert db.radio_vote(1, tid, cycle=0) == 1        # same user doesn't stack
    assert db.radio_vote(2, tid, cycle=0) == 2
    assert db.radio_voted(1, tid, 0) and not db.radio_voted(3, tid, 0)
    assert db.radio_vote_count(tid, cycle=1) == 0     # next airing starts clean
    db.radio_clear_votes(tid, 0)
    assert db.radio_vote_count(tid, 0) == 0


def test_artwork_is_stable_and_shared_per_track():
    assert radio.art_for(7) == radio.art_for(7)       # same track -> same image
    assert {radio.art_for(i) for i in range(24)} == {
        f"/static/radio-art/{n}.jpg" for n in range(1, radio.ART_COUNT + 1)}


def test_metadata_prefers_the_real_artist_over_the_uploader():
    # a re-upload channel / label must not become the artist, and promo tails go
    title, artist = radio._meta(
        {"title": "Clairo - Hello? (feat. Rejjie Snow)", "uploader": "David Dean Burkhart"},
        "Hello? Clairo")
    assert (title, artist) == ("Hello? (feat. Rejjie Snow)", "Clairo")
    assert radio._meta({"title": "Whirr - Rose Cold (Lyrics)"}, "") == ("Rose Cold", "Whirr")
    assert radio._meta({"title": "No Vacation - Reaper | Audiotree Live",
                        "uploader": "Audiotree"}, "") == ("Reaper", "No Vacation")
    # explicit music metadata wins over a title guess
    assert radio._meta({"title": "X - Y (Official Video)", "artist": "Real Artist"},
                       "")[1] == "Real Artist"
    # a title with no separator keeps its own name and falls back to the uploader
    assert radio._meta({"title": "discard", "uploader": "Lil Ugly Mane"}, "") == (
        "discard", "Lil Ugly Mane")


def test_duplicate_submissions_are_dropped_not_parked_as_failures(fresh_db, monkeypatch):
    _ready("Song A")
    dup = db.add_radio_track("song a again", "erin")
    monkeypatch.setattr(radio, "_download",
                        lambda q: (_ for _ in ()).throw(RuntimeError("already on the station")))
    radio.run()
    assert db.get_radio_track(dup) is None            # gone, not a failed queue row


def test_query_dedupe_ignores_case_and_spacing(fresh_db):
    db.add_radio_track("Song A  Artist One", "erin")
    assert db.radio_query_exists("song a artist one")
    assert db.radio_query_exists("  Song A Artist One ")
    assert not db.radio_query_exists("Song B Artist Two")


def test_query_dedupe_handles_spotifys_nonbreaking_space(fresh_db):
    # the real bug: Spotify joins artists with U+00A0, which SQLite's LOWER/TRIM
    # left alone, so multi-artist tracks re-downloaded on every playlist sync
    db.add_radio_track("Never Be Like You (feat. Kai) Flume, kai", "playlist")
    assert db.radio_query_exists("Never Be Like You (feat. Kai) Flume, kai")
    assert db.radio_query_exists("Never Be Like You (feat. Kai) Flume, kai")


def test_title_dedupe_catches_the_same_song_under_another_title(fresh_db):
    _ready("Flume - Never Be Like You feat. Kai", query="q1")
    assert db.radio_title_exists("Flume - Never Be Like You feat. Kai [Official Video]")
    assert db.radio_title_exists("flume  never be like you feat kai (Audio)")
    assert not db.radio_title_exists("Radiohead - Where I End and You Begin")
    # a short title must not swallow unrelated songs via containment
    _ready("discard", query="q2")
    assert not db.radio_title_exists("discard the whole nine yards by someone else")


def test_rotation_is_up_next_then_unplayed_then_shuffled_catalogue(fresh_db):
    fresh_ids = [_ready(f"New{i}") for i in range(2)]
    old_ids = [_ready(f"Old{i}") for i in range(4)]
    for tid in old_ids:                       # these have already been on air
        db.radio_mark_aired(tid)
    titles = [t["title"] for t in radio.station_order()]
    assert titles[:2] == ["New0", "New1"]                  # newest lands at the bottom
    assert sorted(titles[2:]) == ["Old0", "Old1", "Old2", "Old3"]

    db.radio_promote(old_ids[2], True)                     # pull one back to the front
    titles = [t["title"] for t in radio.station_order()]
    assert titles[0] == "Old2" and titles[1:3] == ["New0", "New1"]
    db.radio_promote(old_ids[2], False)                    # demote back
    assert [t["title"] for t in radio.station_order()][:2] == ["New0", "New1"]
    assert fresh_ids


_EMBED_HTML = ('<html><script id="__NEXT_DATA__" type="application/json">'
               '{"props":{"pageProps":{"state":{"data":{"entity":{"title":"Radio",'
               '"trackList":[{"title":"Song A","subtitle":"Artist One"},'
               '{"title":"Song B","subtitle":"Artist Two"}]}}}}}}</script></html>')


class _EmbedResp:
    text = _EMBED_HTML
    status_code = 200


def test_playlist_sync_queues_new_tracks_once(fresh_db, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "RADIO_PLAYLISTS",
                        ["https://open.spotify.com/playlist/abc123?si=x"])
    monkeypatch.setattr(radio.requests, "get", lambda *a, **k: _EmbedResp())
    assert radio.sync_playlists() == 2
    pending = db.radio_pending()
    assert [t["query"] for t in pending] == ["Song A Artist One", "Song B Artist Two"]
    assert all(t["added_by"] == "playlist" for t in pending)
    # second sweep: nothing new; a failed track must not re-queue either
    db.radio_set_failed(pending[0]["id"], "no result")
    assert radio.sync_playlists() == 0


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
