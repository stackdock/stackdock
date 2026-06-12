"""Cloud-metrics module: soft-fail when unconfigured, and TTL caching.

No network: with no tokens set, both providers short-circuit before any
HTTP call, so these tests never touch the wire.
"""
import pytest

from app import config, metrics


@pytest.fixture(autouse=True)
def clear_cache():
    metrics._cache.clear()
    yield
    metrics._cache.clear()


def test_r2_not_configured_without_token(monkeypatch):
    monkeypatch.setattr(config, "CLOUDFLARE_API_TOKEN", "")
    monkeypatch.setattr(config, "CLOUDFLARE_ACCOUNT_ID", "")
    assert metrics.r2_metrics() == {"configured": False}


def test_do_not_configured_without_token(monkeypatch):
    monkeypatch.setattr(config, "DO_API_TOKEN", "")
    monkeypatch.setattr(config, "DO_DROPLET_ID", "")
    assert metrics.do_metrics() == {"configured": False}


def test_cache_avoids_recomputation_within_ttl():
    calls = {"n": 0}

    def fn():
        calls["n"] += 1
        return {"value": calls["n"]}

    first = metrics._cached("k", fn)
    second = metrics._cached("k", fn)
    assert first == second == {"value": 1}
    assert calls["n"] == 1  # second call served from cache


def test_cache_recomputes_after_ttl(monkeypatch):
    calls = {"n": 0}

    def fn():
        calls["n"] += 1
        return calls["n"]

    # force the cached entry to look stale
    metrics._cached("k", fn)
    stale_ts = -10_000  # far in the past
    _, val = metrics._cache["k"]
    metrics._cache["k"] = (stale_ts, val)
    metrics._cached("k", fn)
    assert calls["n"] == 2
