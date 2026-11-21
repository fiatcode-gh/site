"""fiatcode favicon generator: an editor tile with a blue "f" and a cursor.

A dark editor tile carrying a lowercase "f" in JetBrains Mono 700 (the site's
UI face) in the fn blue, followed by a block cursor in the kw amber: someone
typing "f". The colours are the dark theme's, fixed in both themes, so the
icon is the same on every tab bar; a thin line-strong border keeps the tile's
edge visible on dark tab bars. A white f on a blue tile was rejected: at tab
size it reads as Facebook. The glyph outline is extracted from the
self-hosted woff2, so the files carry no font dependency.

The title bar shows public/favicon.svg itself as its logo mark, so the two
cannot drift.

Run from the repo root; it overwrites the icon set in public/:

  uvx --with cairosvg --with fonttools --with brotli --with pillow \\
    python scripts/mkfav.py public
"""
import io
import os
import sys

import cairosvg
from PIL import Image
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

FONT = "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2"
TILE = 64.0
RADIUS = round(TILE * 5 / 18, 2)  # the old logo tile's 5/18 corner ratio
GLYPH_H = 40.0  # 62.5% of the tile: legible at 16px
BORDER = 3.0

# global.css dark-theme values: surface, line-strong, fn, kw.
TILE_BG, EDGE, GLYPH, CURSOR = "#17191e", "#3a404c", "#74b6ff", "#f2a55e"

# Cursor: a block on the baseline, as wide as a stem, after the glyph.
CURSOR_W, CURSOR_H, GAP = 10.0, 12.0, 4.0


def glyph(char="f"):
    font = TTFont(FONT)
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord(char)]
    pen, bounds = SVGPathPen(gs), BoundsPen(gs)
    gs[name].draw(pen)
    gs[name].draw(bounds)
    x0, y0, x1, y1 = bounds.bounds
    s = GLYPH_H / (y1 - y0)
    w = (x1 - x0) * s
    # Centre glyph + gap + cursor as one group.
    left = (TILE - (w + GAP + CURSOR_W)) / 2
    tx = left - x0 * s
    baseline = (TILE + GLYPH_H) / 2 + y0 * s
    cursor_x = left + w + GAP
    return pen.getCommands(), f"translate({tx:.3f} {baseline:.3f}) scale({s:.6f} -{s:.6f})", cursor_x, baseline


def tile_svg(rounded=True, border=True):
    d, transform, cx, baseline = glyph()
    rx = f' rx="{RADIUS:g}"' if rounded else ""
    edge = ""
    if border:
        h = BORDER / 2
        edge = (
            f'<rect x="{h:g}" y="{h:g}" width="{TILE - BORDER:g}" height="{TILE - BORDER:g}"'
            f' rx="{RADIUS - h:g}" fill="none" stroke="{EDGE}" stroke-width="{BORDER:g}"/>'
        )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<rect width="64" height="64"{rx} fill="{TILE_BG}"/>{edge}'
        f'<path fill="{GLYPH}" transform="{transform}" d="{d}"/>'
        f'<rect x="{cx:.3f}" y="{baseline - CURSOR_H:.3f}" width="{CURSOR_W:g}" height="{CURSOR_H:g}" fill="{CURSOR}"/>'
        "</svg>\n"
    )


def render(svg, size):
    data = cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)
    return Image.open(io.BytesIO(data))


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    comment = (
        "<!-- An editor tile: lowercase f in JetBrains Mono 700, in the link blue,\n"
        "     followed by an amber block cursor. Dark theme colours in both\n"
        "     themes. Also the title bar logo. Glyph embedded as an outline. -->\n"
    )
    icon = tile_svg()
    with open(f"{out}/favicon.svg", "w") as f:
        f.write(comment + icon)
    # Each .ico size rendered natively, not downscaled, so 16px stays crisp.
    sizes = [render(icon, s).convert("RGBA") for s in (48, 32, 16)]
    sizes[0].save(
        f"{out}/favicon.ico",
        sizes=[im.size for im in sizes],
        append_images=sizes[1:],
    )
    # Home-screen and PWA icons: opaque full-bleed squares; the OS rounds them.
    square = tile_svg(rounded=False, border=False)
    for name, size in (("apple-touch-icon", 180), ("icon-192", 192), ("icon-512", 512)):
        render(square, size).convert("RGB").save(f"{out}/{name}.png", optimize=True)
    print("ok")
