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


def test_large_catchup_is_silent(fresh_db, monkeypatch):
    # first run: tiny backfill (silent)
    base = ({"tag": "pgl", "name": "Perfect Guy Life"},
            [{"id": "v0", "tag": "e0", "title": "Zero", "episode": 0}])
    _fake_catalogue(monkeypatch, [base])
    sent = _capture_pings(monkeypatch)
    mde.refresh()
    assert sent == []

    # a huge batch shows up at once (e.g. interrupted first backfill / table wipe)
    for i in range(1, mde._MAX_NEW_PINGS + 6):
        base[1].append({"id": f"v{i}", "tag": f"e{i}", "title": f"Ep {i}", "episode": i})
    added = mde.refresh()

    assert added == mde._MAX_NEW_PINGS + 5
    assert sent == []                       # catch-up is NEVER pinged
    assert db.list_unnotified_mde() == []   # all marked seen silently


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


def test_entitled_rules():
    # free content is always watchable
    assert mde._entitled({"free": True, "access": "big"}, {"regular"})
    # tier the account holds
    assert mde._entitled({"free": False, "access": "regular"}, {"regular"})
    # tier the account does NOT hold -> not entitled
    assert not mde._entitled({"free": False, "access": "big"}, {"regular"})
    # unknown products (couldn't read auth) -> don't block, let it try
    assert mde._entitled({"free": False, "access": "big"}, set())


def test_download_fails_fast_on_tier_gap(fresh_db, monkeypatch):
    from app import db
    db.request_mde_download(
        video_id="vBIG", series_tag="tubi-poops", series_name="Tubi Poops",
        title="Housewives", episode=2, duration=577, thumbnail="", added_by="a")
    # a 'big'-tier video, account only has 'regular'
    monkeypatch.setattr(mde, "get_video",
                        lambda vid: {"tag": "hh", "access": "big", "free": False})
    monkeypatch.setattr(mde, "account_products", lambda: {"regular"})
    # if the gate fails, this would be reached and blow up (no browser in tests)
    monkeypatch.setattr(mde, "_signed_playlist",
                        lambda *a, **k: (_ for _ in ()).throw(AssertionError("launched browser")))

    mde.download("vBIG")

    status = db.get_mde_download("vBIG")["status"]
    assert status.startswith("failed: needs 'big' tier")
    assert "regular" in status


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
