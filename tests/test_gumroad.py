"""Gumroad library parser: reads the Inertia.js data-page blob.

Gumroad moved its library to an Inertia.js SPA where every prop (including the
purchase list) is HTML-escaped JSON inside <div id="app" data-page="...">.
These tests lock in that parsing so a future frontend tweak fails loudly.
"""
import html
import json

from app.ingest.gumroad import _extract_purchases


def _inertia_page(results):
    page = {"component": "Library/Index", "props": {"results": results}}
    blob = html.escape(json.dumps(page), quote=True)  # &quot;-encode like Gumroad does
    return f'<html><body><div id="app" data-page="{blob}"></div></body></html>'


def test_extracts_inertia_purchases():
    htmltext = _inertia_page([
        {"product": {"name": "Caribbean Rhythms"},
         "purchase": {"download_url": "https://gumroad.com/d/abc123"}},
        {"product": {"name": "The Guidebook"},
         "purchase": {"download_url": "https://gumroad.com/d/def456"}},
    ])
    out = _extract_purchases(htmltext)
    assert len(out) == 2
    assert out[0] == {"name": "Caribbean Rhythms",
                      "download_url": "https://gumroad.com/d/abc123"}
    assert out[1]["download_url"].endswith("def456")


def test_skips_rows_without_download_url():
    htmltext = _inertia_page([
        {"product": {"name": "No URL"}, "purchase": {}},
        {"product": {"name": "Has URL"},
         "purchase": {"download_url": "https://gumroad.com/d/x"}},
    ])
    out = _extract_purchases(htmltext)
    assert [p["name"] for p in out] == ["Has URL"]


def test_missing_product_name_falls_back():
    htmltext = _inertia_page([
        {"product": {}, "purchase": {"download_url": "https://gumroad.com/d/y"}},
    ])
    out = _extract_purchases(htmltext)
    assert out[0]["name"] == "Gumroad purchase"


def test_no_inertia_blob_returns_empty():
    # falls through to the legacy bs4 parser, which finds nothing here
    assert _extract_purchases("<html><body>nothing here</body></html>") == []
