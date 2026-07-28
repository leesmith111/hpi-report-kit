# One-shot: generate the photo-slot placeholder PNGs embedded in src/placeholders.js.
# Slots stay real pictures even with no photo, so PowerPoint's right-click →
# Change Picture always works (keeps z-order + crop).
import base64, io
from PIL import Image, ImageDraw, ImageFont

LIGHT = (242, 245, 248)   # theme LIGHT F2F5F8
GLYPH = (201, 210, 220)
TXT = (120, 126, 133)     # theme GRAY 787E85

def font(sz, bold=True):
    for name in (["montserrat-bold.ttf", "Montserrat-Bold.ttf", "arialbd.ttf"] if bold else ["montserrat-regular.ttf", "Montserrat-Regular.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(name, sz)
        except OSError:
            continue
    return ImageFont.load_default()

def glyph(d, cx, cy, s):
    # simple photo glyph: rounded frame + mountains + sun
    d.rounded_rectangle([cx - s, cy - s * 0.72, cx + s, cy + s * 0.72], radius=s * 0.12, outline=GLYPH, width=max(3, int(s * 0.07)))
    m = s * 0.62
    d.polygon([(cx - m, cy + s * 0.5), (cx - s * 0.15, cy - s * 0.25), (cx + s * 0.35, cy + s * 0.5)], fill=GLYPH)
    d.polygon([(cx + s * 0.05, cy + s * 0.5), (cx + s * 0.45, cy - s * 0.02), (cx + m, cy + s * 0.5)], fill=GLYPH)
    r = s * 0.13
    d.ellipse([cx + s * 0.38 - r, cy - s * 0.52 - r, cx + s * 0.38 + r, cy - s * 0.52 + r], fill=GLYPH)

def make(w, h, title, sub, glyph_s, f1, f2):
    im = Image.new("RGB", (w, h), LIGHT)
    d = ImageDraw.Draw(im)
    cy = h * 0.42 if sub else h * 0.5
    glyph(d, w / 2, cy - glyph_s * 0.55, glyph_s)
    F1 = font(f1)
    tw = d.textlength(title, font=F1)
    d.text(((w - tw) / 2, cy + glyph_s * 0.45), title, font=F1, fill=TXT)
    if sub:
        F2 = font(f2, bold=False)
        tw2 = d.textlength(sub, font=F2)
        d.text(((w - tw2) / 2, cy + glyph_s * 0.45 + f1 * 1.5), sub, font=F2, fill=TXT)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    b = buf.getvalue()
    print(f"{title.encode('ascii', 'replace').decode()}: {w}x{h} {len(b)/1024:.1f}KB")
    return base64.b64encode(b).decode()

hero = make(1700, 1230, "PHOTO", "Right-click  >  Change Picture… to swap in your photo", 150, 64, 40)
band = make(1700, 310, "HEADER PHOTO — right-click > Change Picture…", None, 80, 44, 0)

with open("_placeholders.out", "w") as f:
    f.write("export const PLACEHOLDER_PHOTO = 'data:image/png;base64," + hero + "';\n\n")
    f.write("export const PLACEHOLDER_BAND = 'data:image/png;base64," + band + "';\n")
print("wrote _placeholders.out")
