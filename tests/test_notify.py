"""Stale-cookie alerting logic in notify.alert_if_stale (pure, network-free)."""
from datetime import datetime, timedelta, timezone

import pytest

from app import config, notify


@pytest.fixture
def captured(monkeypatch):
    """Capture every Discord payload instead of hitting the network."""
    calls = []
    monkeypatch.setattr(notify, "_post", lambda payload: calls.append(payload))
    return calls


def _acct(status=None, last_alert=None):
    return {"id": 1, "user_id": 5, "label": "My Pub",
            "status": status, "last_alert": last_alert}


def _get_user(_uid):
    return {"username": "alice"}


def _make_set_alert():
    recorded = []
    def set_alert(account_id, ts):
        recorded.append((account_id, ts))
    return set_alert, recorded


def test_no_alert_when_status_is_ok(captured):
    set_alert, recorded = _make_set_alert()
    notify.alert_if_stale(_acct(status="OK: 2 new"), "OK: 2 new",
                          "substack", _get_user, set_alert)
    assert captured == []
    assert recorded == []


def test_alerts_on_transition_into_stale(captured):
    set_alert, recorded = _make_set_alert()
    notify.alert_if_stale(_acct(status="OK"), "STALE: cookie expired",
                          "substack", _get_user, set_alert)
    assert len(captured) == 1
    assert "expired" in captured[0]["embeds"][0]["title"].lower()
    # not a reminder on the first alert
    assert "Reminder" not in captured[0]["embeds"][0]["title"]
    assert len(recorded) == 1  # alert timestamp persisted


def test_no_repeat_alert_within_reminder_window(captured, monkeypatch):
    monkeypatch.setattr(config, "STALE_REMINDER_HOURS", 24)
    recent = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    set_alert, recorded = _make_set_alert()
    notify.alert_if_stale(_acct(status="STALE: x", last_alert=recent),
                          "STALE: x", "substack", _get_user, set_alert)
    assert captured == []  # still inside the 24h window
    assert recorded == []


def test_reminder_after_window_elapses(captured, monkeypatch):
    monkeypatch.setattr(config, "STALE_REMINDER_HOURS", 24)
    old = (datetime.now(timezone.utc) - timedelta(hours=30)).isoformat()
    set_alert, recorded = _make_set_alert()
    notify.alert_if_stale(_acct(status="STALE: x", last_alert=old),
                          "STALE: x", "substack", _get_user, set_alert)
    assert len(captured) == 1
    assert "Reminder" in captured[0]["embeds"][0]["title"]
    assert len(recorded) == 1


def test_reminder_hours_zero_means_alert_once_only(captured, monkeypatch):
    monkeypatch.setattr(config, "STALE_REMINDER_HOURS", 0)
    old = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
    set_alert, recorded = _make_set_alert()
    notify.alert_if_stale(_acct(status="STALE: x", last_alert=old),
                          "STALE: x", "substack", _get_user, set_alert)
    assert captured == []  # reminders disabled
    assert recorded == []


# ---- unified digest + outbound webhook ----

def _items(n_art=2, n_ep=1):
    items = [{"type": "article", "source": f"Pub {i}", "title": f"Post {i}",
              "url": f"http://x/read/post-{i}", "original_url": None, "published_at": None}
             for i in range(n_art)]
    items += [{"type": "episode", "source": "Show", "title": f"Ep {i}",
               "url": f"http://x/listen/ep-{i}", "original_url": None, "published_at": None}
              for i in range(n_ep)]
    return items


def test_digest_sends_one_embed_for_many_items(captured):
    notify.notify_digest(_items(5, 3))
    assert len(captured) == 1  # ONE message, not 8
    desc = captured[0]["embeds"][0]["description"]
    assert "Post 0" in desc and "Ep 0" in desc
    assert "5 articles + 3 episodes" in captured[0]["embeds"][0]["title"]


def test_digest_truncates_long_runs(captured):
    notify.notify_digest(_items(30, 0))
    desc = captured[0]["embeds"][0]["description"]
    assert "more" in desc


def test_digest_silent_when_nothing_new(captured):
    notify.notify_digest([])
    assert captured == []


def test_outbound_webhook_posts_one_combined_payload(monkeypatch):
    sent = []
    monkeypatch.setattr(config, "OUTBOUND_WEBHOOK_URL", "https://hooks.test/x")
    monkeypatch.setattr(notify.requests, "post",
                        lambda url, json, timeout: sent.append((url, json)) or
                        type("R", (), {"status_code": 200})())
    notify.push_outbound(_items(2, 1))
    assert len(sent) == 1
    url, payload = sent[0]
    assert payload["source"] == "stackdock"
    assert len(payload["new_articles"]) == 2 and len(payload["new_episodes"]) == 1


def test_outbound_webhook_skipped_when_unset(monkeypatch):
    monkeypatch.setattr(config, "OUTBOUND_WEBHOOK_URL", "")
    monkeypatch.setattr(notify.requests, "post",
                        lambda *a, **k: (_ for _ in ()).throw(AssertionError("should not post")))
    notify.push_outbound(_items())


def test_flush_is_resilient_and_exactly_once(fresh_db, captured):
    from app import db
    db.insert_article("m-new", "Pub", "Fresh", "a", None, "<p>x</p>", None, notified=0)
    db.insert_article("m-old", "Pub", "Already announced", "a", None, "<p>x</p>", None, notified=1)
    notify.flush()
    assert len(captured) == 1                              # one digest embed
    desc = captured[0]["embeds"][0]["description"]
    assert "Fresh" in desc and "Already announced" not in desc
    notify.flush()                                         # nothing left to send
    assert len(captured) == 1                              # not re-announced
