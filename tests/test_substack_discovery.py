"""Discovery fallbacks: public-profile parsing and loud subscriptions errors."""
import json

import pytest

from app.ingest import substack


class FakeResp:
    def __init__(self, status, payload=None, text=""):
        self.status_code = status
        self._payload = payload
        self.text = text or (json.dumps(payload) if payload is not None else "")

    def json(self):
        if self._payload is None:
            raise ValueError("not json")
        return self._payload


def test_profile_discovery_parses_library_shape(monkeypatch):
    profile = {"subscriptions": [
        {"publication": {"name": "Blog A", "subdomain": "bloga", "custom_domain": None},
         "membership_state": "subscribed"},
        {"publication": {"name": "Blog B", "subdomain": "ignored", "custom_domain": "blogb.com"},
         "membership_state": "paid"},
        {"publication": {"name": None, "subdomain": "broken"}},  # skipped defensively
    ]}
    monkeypatch.setattr(substack, "_get_json", lambda s, url, params=None: profile)
    monkeypatch.setattr(substack, "_effective_base",
                        lambda s, sub, custom: f"https://{custom}" if custom
                        else f"https://{sub}.substack.com")
    pubs = substack.get_publications_via_profile(object(), "someone")
    assert pubs == [
        {"name": "Blog A", "base_url": "https://bloga.substack.com", "paid": True},
        {"name": "Blog B", "base_url": "https://blogb.com", "paid": True}]


def test_profile_discovery_handles_garbage(monkeypatch):
    monkeypatch.setattr(substack, "_get_json", lambda s, url, params=None: None)
    assert substack.get_publications_via_profile(object(), "someone") == []


def test_subscriptions_error_carries_substack_message(monkeypatch):
    body = '{"errors":[{"location":"query","param":"limit","msg":"required"}]}'

    class S:
        def get(self, url, params=None, timeout=None):
            return FakeResp(400, text=body)

    monkeypatch.setattr(substack.time, "sleep", lambda *_: None)
    with pytest.raises(substack.SubscriptionsApiError) as e:
        substack.get_publications(S())
    assert "param" in str(e.value) and "limit" in str(e.value)


def test_stale_cookie_still_returns_none(monkeypatch):
    class S:
        def get(self, url, params=None, timeout=None):
            return FakeResp(401)

    monkeypatch.setattr(substack.time, "sleep", lambda *_: None)
    assert substack.get_publications(S()) is None
