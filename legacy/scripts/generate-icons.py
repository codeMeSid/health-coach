#!/usr/bin/env python3
"""Regenerate PWA icons + splash screens. Requires: python3 -m venv .venv && .venv/bin/pip install pillow"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "icons"
OUT.mkdir(exist_ok=True)

PRIMARY = (45, 88, 110)
PRIMARY_DARK = (28, 55, 70)
INK = (40, 52, 58)
ACCENT = (168, 118, 48)
PAPER = (252, 250, 246)


def make_base(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(size * 0.12) if maskable else 0
    if maskable:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 5, fill=PRIMARY)
        m = pad
        d.rounded_rectangle([m, m, size - 1 - m, size - 1 - m], radius=size // 8, fill=PRIMARY_DARK)
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 6, fill=PRIMARY)

    cx, cy = size / 2, size / 2
    stroke = max(2, size // 32)
    r = size * 0.22
    diamond = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    d.polygon(diamond, fill=PAPER)
    d.line([(cx, cy - r), (cx, cy + r)], fill=ACCENT, width=stroke)
    d.line([(cx - r * 0.55, cy), (cx + r * 0.55, cy)], fill=PRIMARY, width=max(1, stroke // 2))
    pin_r = size * 0.045
    d.ellipse([cx - pin_r, cy - pin_r - r * 0.15, cx + pin_r, cy + pin_r - r * 0.15], fill=ACCENT)
    return img


def splash(w, h, name):
    img = Image.new("RGB", (w, h), PAPER)
    band = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    for i in range(40):
        alpha = int(18 * (1 - i / 40))
        bd.ellipse(
            [w * 0.5 - w * 0.7 - i * 8, -h * 0.2 - i * 8, w * 0.5 + w * 0.7 + i * 8, h * 0.55 + i * 8],
            fill=(*PRIMARY, alpha),
        )
    img = Image.alpha_composite(img.convert("RGBA"), band).convert("RGB")
    d = ImageDraw.Draw(img)
    icon_size = min(w, h) // 4
    icon = make_base(icon_size)
    ix, iy = (w - icon_size) // 2, int(h * 0.32)
    img.paste(icon, (ix, iy), icon)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia.ttf", size=max(28, w // 14))
        small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Georgia.ttf", size=max(14, w // 32))
    except Exception:
        font = small = ImageFont.load_default()
    title = "Health Map"
    bbox = d.textbbox((0, 0), title, font=font)
    tw = bbox[2] - bbox[0]
    d.text(((w - tw) // 2, iy + icon_size + h * 0.04), title, fill=INK, font=font)
    sub = "Today's plate & training"
    bbox2 = d.textbbox((0, 0), sub, font=small)
    sw = bbox2[2] - bbox2[0]
    d.text(((w - sw) // 2, iy + icon_size + h * 0.04 + (bbox[3] - bbox[1]) + 12), sub, fill=ACCENT, font=small)
    img.save(OUT / name, optimize=True, quality=90)


def main():
    for s in [16, 32, 48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]:
        make_base(s).save(OUT / f"icon-{s}.png", optimize=True)
    make_base(512, True).save(OUT / "maskable-512.png", optimize=True)
    make_base(192, True).save(OUT / "maskable-192.png", optimize=True)
    make_base(180).save(OUT / "apple-touch-icon.png", optimize=True)
    icos = [make_base(s) for s in (16, 32, 48)]
    icos[0].save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=icos[1:])

    for w, h, name in [
        (1290, 2796, "splash-1290x2796.png"),
        (1179, 2556, "splash-1179x2556.png"),
        (1170, 2532, "splash-1170x2532.png"),
        (1284, 2778, "splash-1284x2778.png"),
        (750, 1334, "splash-750x1334.png"),
        (1242, 2688, "splash-1242x2688.png"),
        (2048, 2732, "splash-2048x2732.png"),
        (1080, 1920, "splash-1080x1920.png"),
        (1920, 1080, "splash-1920x1080-land.png"),
    ]:
        splash(w, h, name)
    print(f"Wrote icons to {OUT}")


if __name__ == "__main__":
    main()
