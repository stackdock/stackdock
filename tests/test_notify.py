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
                          "STALE: x", "gumroad", _get_user, set_alert)
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
