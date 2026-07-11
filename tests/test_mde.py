"""mde.tv catalogue refresh: silent first backfill, ping only genuinely-new
episodes, and crash-safe pending on a webhook outage."""
from app import db
from app.ingest import mde


def _fake_catalogue(monkeypatch, series):
    """series = [ (series_dict, [video_dict, ...]), ... ]"""
    monkeypatch.setattr(mde, "list_series",
                        lambda force=False: [s for s, _ in series])
    by_tag = {s["tag"]: vids for s, vids in series}
    monkeypatch.setattr(mde, "list_episodes",
                        lambda tag, force=False: ({"tag": tag}, by_tag.get(tag, [])))


def _capture_pings(monkeypatch):
    sent = []
    monkeypatch.setattr("app.notify.notify_mde",
                        lambda eps: (sent.append(eps) or True))
    return sent


def test_first_run_is_silent_backfill(fresh_db, monkeypatch):
    _fake_catalogue(monkeypatch, [
        ({"tag": "pgl", "name": "Perfect Guy Life"},
         [{"id": "v1", "tag": "e1", "title": "One", "episode": 1},
          {"id": "v2", "tag": "e2", "title": "Two", "episode": 2}]),
    ])
    sent = _capture_pings(monkeypatch)

    added = mde.refresh()

    assert added == 2
    assert sent == []                       # first run NEVER pings
    assert db.mde_catalogue_count() == 2
    assert db.list_unnotified_mde() == []   # all recorded as already-notified


def test_only_new_episodes_ping(fresh_db, monkeypatch):
    base = ({"tag": "pgl", "name": "Perfect Guy Life"},
            [{"id": "v1", "tag": "e1", "title": "One", "episode": 1}])
    _fake_catalogue(monkeypatch, [base])
    sent = _capture_pings(monkeypatch)
    mde.refresh()                           # silent backfill of v1
    assert sent == []

    # a new episode appears in the same show
    base[1].append({"id": "v2", "tag": "e2", "title": "Two", "episode": 2})
    added = mde.refresh()

    assert added == 1
    assert len(sent) == 1
    assert [e["title"] for e in sent[0]] == ["#2 Two"]
    assert sent[0][0]["url"].endswith("/mde/pgl")
    assert db.list_unnotified_mde() == []   # marked after successful post


def test_no_change_no_ping(fresh_db, monkeypatch):
    _fake_catalogue(monkeypatch, [
        ({"tag": "shs", "name": "Sam Hyde Show"},
         [{"id": "v1", "tag": "e1", "title": "Ep", "episode": 1}]),
    ])
    sent = _capture_pings(monkeypatch)
    mde.refresh()                           # backfill
    added = mde.refresh()                   # nothing new
    assert added == 0
    assert sent == []


def test_webhook_outage_leaves_pending(fresh_db, monkeypatch):
    base = ({"tag": "tow", "name": "Tales of Wape"},
            [{"id": "v1", "tag": "e1", "title": "One", "episode": 1}])
    _fake_catalogue(monkeypatch, [base])
    mde.refresh()                           # silent backfill of v1

    base[1].append({"id": "v2", "tag": "e2", "title": "Two", "episode": 2})
    # webhook down -> notify_mde returns False
    monkeypatch.setattr("app.notify.notify_mde", lambda eps: False)
    mde.refresh()
    assert [r["video_id"] for r in db.list_unnotified_mde()] == ["v2"]

    # next run: webhook back -> pending v2 gets delivered and marked
    sent = _capture_pings(monkeypatch)
    mde.refresh()
    assert len(sent) == 1
    assert [e["title"] for e in sent[0]] == ["#2 Two"]
    assert db.list_unnotified_mde() == []
