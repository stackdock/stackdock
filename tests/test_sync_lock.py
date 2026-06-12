"""Overlapping sync runs (scheduler + manual button) must not stack requests."""
import threading
import time

from app.ingest import substack


def test_concurrent_runs_skip(monkeypatch, fresh_db):
    started, release = threading.Event(), threading.Event()

    def slow_run():
        started.set()
        release.wait(timeout=5)
        return 7

    monkeypatch.setattr(substack, "_run", slow_run)
    results = {}
    t = threading.Thread(target=lambda: results.setdefault("first", substack.run()))
    t.start()
    assert started.wait(timeout=5)
    results["second"] = substack.run()   # while first still holds the lock
    release.set()
    t.join(timeout=5)
    assert results["second"] == 0        # overlap skipped
    assert results["first"] == 7         # original completed
