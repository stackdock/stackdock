"""Substack ingest helpers: paid-lock detection (pure, network-free)."""
from app.ingest.substack import _is_locked


def test_unlocked_when_body_far_longer_than_preview():
    # full post: body_html is hundreds of times the truncated teaser
    post = {"body_html": "x" * 24000, "truncated_body_text": "y" * 88}
    assert _is_locked(post) is False


def test_locked_when_body_is_just_the_preview():
    # paywalled: body_html is essentially the same length as the preview text
    post = {"body_html": "z" * 363, "truncated_body_text": "z" * 356}
    assert _is_locked(post) is True


def test_not_locked_without_preview_text():
    # free posts carry no truncated_body_text -> never "locked"
    assert _is_locked({"body_html": "short", "truncated_body_text": ""}) is False
    assert _is_locked({"body_html": "short"}) is False
