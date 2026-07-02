"""Substack ingest helpers: paid-lock detection (pure, network-free).

A paid post is "locked" (no-access preview) when Substack's posts/by-id response
carries `hidden: True`, OR the body is empty. It is unlocked (full access) when
the body is present and either `hidden` is falsy or Substack injected its
paywall-jump marker. (The old rule keyed only on the marker, which mislabeled
pubs like J'accuse that serve full paid bodies to subscribers without a marker.)
"""
from app.ingest.substack import _is_locked, _clean_body


def test_unlocked_when_paywall_marker_present():
    post = {"body_html": '<p>full content</p>'
                         '<div class="paywall-jump" data-component-name="PaywallToDOM"></div>'
                         '<p>more content past the wall</p>'}
    assert _is_locked(post) is False


def test_locked_when_no_access_preview_is_hidden():
    # a no-access preview: truncated teaser, no marker, and Substack marks it hidden
    post = {"body_html": "<p>This is just the free preview teaser and then it stops…</p>",
            "hidden": True}
    assert _is_locked(post) is True


def test_unlocked_markerless_full_body_when_not_hidden():
    # J'accuse case: a paying cookie gets the FULL body with no paywall marker and
    # `hidden` falsy — must NOT be treated as locked (the old marker-only rule did)
    post = {"body_html": "<p>" + ("full essay text " * 200) + "</p>", "hidden": None}
    assert _is_locked(post) is False


def test_locked_when_body_empty_or_missing():
    assert _is_locked({"body_html": ""}) is True
    assert _is_locked({}) is True


def test_class_paywall_variant_also_counts_as_unlocked():
    post = {"body_html": '<div class="paywall">…</div><p>full text</p>'}
    assert _is_locked(post) is False


def test_clean_body_strips_subscribe_widget():
    html = ('<p>Real content.</p>'
            '<div class="subscription-widget-wrap" data-attrs="{}">'
            '<div class="subscription-widget"><p class="cta-caption">Restoring Order is a '
            'reader-supported publication. To receive new posts and support my work, consider '
            'becoming a free or paid subscriber.</p>'
            '<form class="subscription-widget-subscribe"><input type="email"></form></div></div>'
            '<p>More content.</p>')
    out = _clean_body(html)
    assert "Real content." in out and "More content." in out
    assert "reader-supported publication" not in out
    assert "<form" not in out and "subscription-widget" not in out


def test_clean_body_strips_bare_cta_paragraph():
    html = '<p>Body.</p><p>Foo is a reader-supported publication. Become a paid subscriber.</p>'
    out = _clean_body(html)
    assert "Body." in out and "reader-supported publication" not in out


def test_clean_body_leaves_normal_html_untouched():
    html = "<p>Just an article with no widgets.</p>"
    assert _clean_body(html) == html
