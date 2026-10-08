#!/usr/bin/env python3
"""Derive web-ready masters from the creative kit (the kit itself is never modified).

    python3 -m venv .venv && .venv/bin/pip install opencv-python-headless numpy pillow scipy
    .venv/bin/python scripts/prepare-sources.py

Writes to assets-src/:
  logo-olive.png / logo-ivory.png   alpha cleaned (speckle removed) and trimmed
  hero-plate.jpg                    hero wall with the portrait inpainted out, so the
                                    alpha portrait can move over it without doubled contours
  real-*.jpg                        the business's own photos, cropped out of the supplied
                                    screenshots (no retouching, no added labels)
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "townsville-a-finer-line"
OUT = ROOT / "assets-src"
OUT.mkdir(exist_ok=True)


def clean_logo(src: Path, dst: Path) -> None:
    im = np.array(Image.open(src).convert("RGBA"))
    a = im[:, :, 3].astype(np.float32)
    a[a < 28] = 0
    labels, n = ndimage.label(a > 0)
    # Speckles are faint; glyphs (even the thin "I" of the descriptor) reach full opacity.
    peaks = ndimage.maximum(a, labels, range(1, n + 1))
    sizes = ndimage.sum(np.ones_like(a), labels, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = (peaks >= 200) & (sizes >= 40)
    a[~keep[labels]] = 0
    im[:, :, 3] = a.astype(np.uint8)
    ys, xs = np.nonzero(im[:, :, 3])
    pad = 8
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad + 1, im.shape[1]), min(ys.max() + pad + 1, im.shape[0]))
    Image.fromarray(im).crop(box).save(dst, optimize=True)
    print(f"{dst.name}: {n} components -> kept {int(keep.sum())}, box {box}")
    return im, labels, keep


def split_logo(im, labels, keep, stem) -> None:
    """Wordmark without the descriptor (narrow headers) and the arched T alone (favicon)."""
    objs = ndimage.find_objects(labels)
    word = im.copy()
    for i, sl in enumerate(objs, start=1):
        if keep[i] and sl[0].start > 500:  # descriptor glyphs sit below the wordmark baseline
            word[:, :, 3][labels == i] = 0
    ys, xs = np.nonzero(word[:, :, 3])
    Image.fromarray(word).crop((xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7)).save(OUT / "logo-olive-wordmark.png", optimize=True)
    t = np.zeros_like(im)
    t_label = labels[stem[1], stem[0]]
    t[labels == t_label] = im[labels == t_label]
    ys, xs = np.nonzero(t[:, :, 3])
    side = max(xs.max() - xs.min(), ys.max() - ys.min()) + 40
    cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
    Image.fromarray(t).crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)).save(OUT / "mark-olive.png", optimize=True)
    print("wordmark + mark written, T component", t_label)


def hero_plate() -> None:
    photo = cv2.imread(str(KIT / "03-hero/hero-portrait-desktop.png"))
    alpha = np.array(Image.open(KIT / "05-camadas/portrait-alpha.png"))[:, :, 3]
    hole = (alpha > 6).astype(np.uint8) * 255
    hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    # Inpaint at half size (a hole this large is slow and smeary at full size anyway),
    # then refine the band next to the silhouette at full size: that band is the only
    # part the hero's parallax ever reveals.
    h, w = hole.shape
    small = cv2.inpaint(cv2.resize(photo, (w // 2, h // 2), interpolation=cv2.INTER_AREA),
                        cv2.resize(hole, (w // 2, h // 2), interpolation=cv2.INTER_NEAREST), 12, cv2.INPAINT_TELEA)
    fill = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)
    plate = np.where(hole[:, :, None] > 0, fill, photo)
    band = cv2.subtract(hole, cv2.erode(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (121, 121))))
    plate = cv2.inpaint(plate, band, 9, cv2.INPAINT_TELEA)
    # soften the seam of the low-res fill without touching the untouched wall
    soft = cv2.GaussianBlur(plate, (0, 0), 6)
    inner = cv2.erode(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (161, 161)))
    m = cv2.GaussianBlur(inner, (0, 0), 20).astype(np.float32)[:, :, None] / 255
    plate = (plate * (1 - m) + soft * m).astype(np.uint8)
    cv2.imwrite(str(OUT / "hero-plate.jpg"), plate, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print("hero-plate.jpg written")


REAL = KIT / "00-referencias"
CROPS = {
    # file, box (left, top, right, bottom) measured from the photo bounds inside each screenshot
    "real-brow-threading.jpg": ("Screenshot 2026-10-08 at 11.11.54.png", (2, 64, 994, 1060)),
    "real-brow-tint.jpg": ("Screenshot 2026-10-08 at 11.11.35.png", (12, 138, 1012, 1095)),
    "real-henna.jpg": ("Screenshot 2026-10-08 at 11.11.15.png", (10, 169, 958, 1113)),
}
# 3x3 photo grid from the business page: tiles 6 (line drawing) and 7 (stock eye) are not
# the business's own work and are skipped.
GRID = ("Screenshot 2026-10-08 at 11.10.57.png",
        [(110, 323), (331, 545), (553, 766)], [(144, 357), (365, 579), (587, 800)])
SKIP = {5, 6}


def real_photos() -> None:
    for name, (src, box) in CROPS.items():
        Image.open(REAL / src).convert("RGB").crop(box).save(OUT / name, quality=95)
        print(name, box)
    src, cols, rows = GRID
    im = Image.open(REAL / src).convert("RGB")
    i = n = 0
    for (t, b) in rows:
        for (l, r) in cols:
            if i not in SKIP:
                n += 1
                im.crop((l + 8, t + 8, r - 8, b - 8)).save(OUT / f"real-hair-{n}.jpg", quality=95)
            i += 1
    print(f"{n} hair tiles")


if __name__ == "__main__":
    split_logo(*clean_logo(KIT / "01-identidade/logo-olive-alpha.png", OUT / "logo-olive.png"), stem=(345, 400))
    clean_logo(KIT / "01-identidade/logo-ivory-alpha.png", OUT / "logo-ivory.png")
    hero_plate()
    real_photos()
