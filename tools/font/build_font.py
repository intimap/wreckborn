"""Builds the Wreckborn pixel fonts from glyphs*.txt into assets/fonts/*.woff2 (and .ttf).
Each pixel becomes a 100x100 square in font units. The em is the glyph grid height (asc + desc rows),
so Wreckborn Serif (12 rows) is pixel-perfect at multiples of 12px and Wreckborn Small (8 rows) at multiples of 8px."""
import pathlib
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent / "assets" / "fonts"
PX = 100
ASC_ROWS = DESC_ROWS = 0  # set per font from its @metrics line
NAMES = {"space": " "}


def parse(path):
    glyphs, cur, meta = {}, None, {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("@metrics"):
            for part in line.split(" ")[1:]:
                k, _, v = part.partition("=")
                meta[k] = v
            meta["family"] = line.split("family=", 1)[1]
            continue
        if line.startswith("#") and not line.startswith("##") and cur is None or not line.strip():
            continue
        if line.startswith("== "):
            _, ch, top = line.split(" ")
            ch = NAMES.get(ch, ch)
            cur = glyphs[ch] = {"top": int(top), "rows": []}
        elif cur is not None:
            cur["rows"].append(line.rstrip())
    return glyphs, meta


def outline(pixels):
    """Trace the boundary of a set of (col,row) pixels into closed loops (clockwise, y-up)."""
    edges = {}
    for c, r in pixels:
        x0, x1 = c * PX, (c + 1) * PX
        y1, y0 = (ASC_ROWS - r) * PX, (ASC_ROWS - r - 1) * PX
        # clockwise in y-up: top-left -> top-right -> bottom-right -> bottom-left
        for a, b in (((x0, y1), (x1, y1)), ((x1, y1), (x1, y0)), ((x1, y0), (x0, y0)), ((x0, y0), (x0, y1))):
            if (b, a) in edges:
                del edges[(b, a)]
            else:
                edges[(a, b)] = True
    nexts = {}
    for a, b in edges:
        nexts.setdefault(a, []).append(b)
    loops = []
    while nexts:
        start = next(iter(nexts))
        loop, cur, prev = [start], start, None
        while True:
            outs = nexts[cur]
            if len(outs) > 1 and prev is not None:  # diagonal touch: turn right (keeps pixels separate)
                dx, dy = cur[0] - prev[0], cur[1] - prev[1]
                right = (cur[0] + dy, cur[1] - dx)
                nxt = right if right in outs else outs[0]
            else:
                nxt = outs[0]
            outs.remove(nxt)
            if not outs:
                del nexts[cur]
            prev, cur = cur, nxt
            if cur == start and (start not in nexts):
                break
            if cur == start:
                break
            loop.append(cur)
        # drop collinear points
        pts = [p for i, p in enumerate(loop)
               if not ((loop[i - 1][0] == p[0] == loop[(i + 1) % len(loop)][0]) or
                       (loop[i - 1][1] == p[1] == loop[(i + 1) % len(loop)][1]))]
        loops.append(pts)
    return loops


def build(path):
    global ASC_ROWS, DESC_ROWS
    glyphs, meta = parse(path)
    ASC_ROWS, DESC_ROWS = int(meta["asc"]), int(meta["desc"])
    order = [".notdef"] + [f"uni{ord(ch):04X}" for ch in glyphs]
    fb = FontBuilder(unitsPerEm=(ASC_ROWS + DESC_ROWS) * PX, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(ch): f"uni{ord(ch):04X}" for ch in glyphs})
    tt, metrics = {}, {}
    pen = TTGlyphPen(None)
    top = ASC_ROWS * PX
    pen.moveTo((50, 0)); pen.lineTo((50, top)); pen.lineTo((top * 2 // 3, top)); pen.lineTo((top * 2 // 3, 0)); pen.closePath()
    tt[".notdef"] = pen.glyph(); metrics[".notdef"] = (top * 2 // 3 + 150, 50)
    for ch, g in glyphs.items():
        name = f"uni{ord(ch):04X}"
        width = max(len(r) for r in g["rows"])
        pixels = {(c, g["top"] + r) for r, row in enumerate(g["rows"]) for c, v in enumerate(row) if v == "#"}
        pen = TTGlyphPen(None)
        for loop in outline(pixels):
            pen.moveTo(loop[0])
            for p in loop[1:]:
                pen.lineTo(p)
            pen.closePath()
        tt[name] = pen.glyph()
        metrics[name] = ((width + 1) * PX, 0)
    fb.setupGlyf(tt)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC_ROWS * PX, descent=-DESC_ROWS * PX)
    fb.setupNameTable({"familyName": meta["family"], "styleName": "Regular"})
    fb.setupOS2(sTypoAscender=ASC_ROWS * PX, sTypoDescender=-DESC_ROWS * PX, sTypoLineGap=0,
                usWinAscent=ASC_ROWS * PX, usWinDescent=DESC_ROWS * PX, sxHeight=int(meta["x"]) * PX, sCapHeight=ASC_ROWS * PX)
    fb.setupPost()
    OUT.mkdir(parents=True, exist_ok=True)
    fb.save(OUT / f"{meta['file']}.ttf")
    fb.font.flavor = "woff2"
    fb.save(OUT / f"{meta['file']}.woff2")
    print(f"Built {meta['family']}: {len(glyphs)} glyphs -> {OUT}")


if __name__ == "__main__":
    for path in sorted(HERE.glob("glyphs*.txt")):
        build(path)
