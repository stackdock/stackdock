#!/usr/bin/env python3
"""Regenerate the PWA icons (app/static/icon-*.png, apple-touch-icon.png).

Default style is "polished": the same stack glyph and palette as v1, with a
subtle vertical gradient background and a soft glyph shadow (2025-era icon
guidance: one simple glyph, soft depth, no text). Run with --flat to get the
original perfectly-flat rendering back without touching git.

    python3 scripts/gen_icons.py          # polished (current)
    python3 scripts/gen_icons.py --flat   # original flat style

Geometry is measured off the original icons so both styles are pixel-compatible.
apple-touch-icon is full-bleed (iOS applies its own mask; transparent corners
render as black on the home screen). Maskable keeps the glyph inside the
central 80% safe zone. After changing icons, bump STATIC_CACHE in sw.js.
"""
import sys

from PIL import Image, ImageDraw, ImageFilter

GREEN = (46, 110, 78)        # #2e6e4e — brand green (theme_color)
BAR = (246, 247, 244)        # #f6f7f4 — bars
DOT = (227, 236, 230)        # #e3ece6 — dot accent
S = 4                        # supersample factor
SIZE = 512
CORNER_R = 90

# glyph geometry at 512px: (x0, y0, x1, y1) boxes, rounded ends
DOT_BOX = (233, 92, 278, 136)
BARS = [(109, 205, 403, 257), (92, 286, 394, 339), (125, 367, 387, 420)]

FLAT = "--flat" in sys.argv


def scaled(box, s=S, dx=0, dy=0):
    return tuple(v * s + (dx if i % 2 == 0 else dy) for i, v in enumerate(box))


def background(size):
    """Brand-green square; polished style gets a subtle top-lit gradient."""
    im = Image.new("RGBA", (size, size), GREEN + (255,))
    if FLAT:
        return im
    top = tuple(min(255, int(c * 1.10)) for c in GREEN)
    bottom = tuple(int(c * 0.93) for c in GREEN)
    grad = Image.new("RGBA", (1, size))
    for y in range(size):
        t = y / (size - 1)
        grad.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    return grad.resize((size, size))


def glyph_layer(size, fill_bar, fill_dot):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse(scaled(DOT_BOX), fill=fill_dot)
    for b in BARS:
        x0, y0, x1, y1 = scaled(b)
        d.rounded_rectangle((x0, y0, x1, y1), radius=(y1 - y0) // 2, fill=fill_bar)
    return im


def render():
    big = SIZE * S
    im = background(big)
    if not FLAT:
        # soft shadow under the glyph: black, blurred, nudged down, ~16% alpha
        shadow = glyph_layer(big, (0, 0, 0, 255), (0, 0, 0, 255))
        shadow = shadow.transform(shadow.size, Image.AFFINE, (1, 0, 0, 0, 1, -6 * S))
        shadow = shadow.filter(ImageFilter.GaussianBlur(8 * S))
        shadow.putalpha(shadow.getchannel("A").point(lambda a: a * 16 // 100))
        im.alpha_composite(shadow)
    im.alpha_composite(glyph_layer(big, BAR + (255,), DOT + (255,)))
    return im


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), radius=radius, fill=255)
    out = im.copy()
    out.putalpha(mask)
    return out


def save(im, path, size):
    im.resize((size, size), Image.LANCZOS).save(path)
    print(path)


full = render()  # full-bleed square at 4x

save(rounded(full, CORNER_R * S), "app/static/icon-512.png", 512)
save(rounded(full, CORNER_R * S), "app/static/icon-192.png", 192)
save(full, "app/static/icon-maskable-512.png", 512)
save(full, "app/static/apple-touch-icon.png", 180)
