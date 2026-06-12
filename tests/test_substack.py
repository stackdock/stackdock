"""Substack ingest helpers: paid-lock detection (pure, network-free).

A paid post is "unlocked" (full access) only when Substack injects its
paywall-jump marker into body_html — i.e. the account can read past the
paywall. A no-access preview omits the marker.
"""
from app.ingest.substack import _is_locked, _clean_body


def test_unlocked_when_paywall_marker_present():
    post = {"body_html": '<p>full content</p>'
                         '<div class="paywall-jump" data-component-name="PaywallToDOM"></div>'
                         '<p>more content past the wall</p>'}
    assert _is_locked(post) is False


def test_locked_when_no_paywall_marker():
    # truncated teaser, cut off mid-content, no marker
    post = {"body_html": "<p>This is just the free preview teaser and then it stops…</p>"}
    assert _is_locked(post) is True


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
