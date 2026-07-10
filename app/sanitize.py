"""HTML sanitization for remote content rendered into pages.

Article bodies (Substack), episode show-notes, and email bodies are third-party
HTML we render raw with Jinja's `|safe`. A malicious or compromised publication
could ship <script>/<img onerror>/javascript: URLs that would run in our
authenticated same-origin context. We scrub that at RENDER time (so it also
covers rows already stored before this existed) with nh3 (ammonia): an allowlist
sanitizer that strips scripts, event handlers, and dangerous URL schemes while
keeping ordinary formatting, links, and images.
"""
import logging

log = logging.getLogger("stackdock.sanitize")

# formatting + media tags a newsletter body legitimately uses
_ALLOWED_TAGS = {
    "a", "abbr", "b", "blockquote", "br", "caption", "code", "col", "colgroup",
    "dd", "del", "div", "dl", "dt", "em", "figcaption", "figure", "h1", "h2",
    "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "li", "mark", "ol", "p",
    "pre", "q", "s", "small", "span", "strong", "sub", "sup", "table", "tbody",
    "td", "tfoot", "th", "thead", "tr", "u", "ul", "picture", "source",
}
_ALLOWED_ATTRS = {
    # NB: no "rel" here — link_rel (below) manages it; nh3 errors if both are set
    "a": {"href", "title", "target"},
    "img": {"src", "srcset", "alt", "title", "width", "height", "loading"},
    "source": {"srcset", "src", "type", "media"},
    "col": {"span"},
    "colgroup": {"span"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan", "scope"},
    "*": {"class"},
}

try:
    import nh3

    def clean(html: str) -> str:
        if not html:
            return ""
        return nh3.clean(
            html,
            tags=_ALLOWED_TAGS,
            attributes=_ALLOWED_ATTRS,
            link_rel="noopener noreferrer nofollow",
            url_schemes={"http", "https", "mailto"},
        )
except ImportError:                                             # pragma: no cover
    # nh3 must be installed in production (it's in requirements). If it's somehow
    # missing, fail SAFE: escape everything rather than serve raw remote HTML.
    import html as _html
    log.error("nh3 not installed — falling back to full HTML escaping. "
              "Install nh3 to render formatted article/episode bodies.")

    def clean(html: str) -> str:
        return _html.escape(html or "")
