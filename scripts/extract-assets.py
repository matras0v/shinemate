#!/usr/bin/env python3
"""
Готовит web-ассеты из исходников заказчика.

Источники (не публикуются, лежат в assets/raw):
  assets/raw/logo-source.jpg  — логотип «Правильные Технологии» (1032x940)
  assets/raw/xlsx/xl/media/*  — реальные фото товаров ShineMate из прайса

Результат: public/brand/*, public/products/*
"""
import json
import os
from collections import deque

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")
MEDIA = os.path.join(RAW, "xlsx", "xl", "media")
BRAND = os.path.join(ROOT, "public", "brand")
PRODUCTS = os.path.join(ROOT, "public", "products")

# Фон страницы, под который расcчитывается альфа логотипа.
PAGE_BG = 246
INK = 26


def ensure_dirs():
    for d in (BRAND, PRODUCTS):
        os.makedirs(d, exist_ok=True)


# ─────────────────────────────  ЛОГОТИП  ─────────────────────────────

def logo_rgba(crop, ink=INK, bg=PAGE_BG, cutoff=205):
    """Серый логотип на светлом фоне → RGBA с чернильным цветом и мягкой альфой.

    Альфа подобрана так, чтобы на фоне PAGE_BG пиксель воспроизвёл исходную
    яркость: result = a*ink + (1-a)*bg. Полутоновые линии honeycomb при этом
    сохраняются, а фон исходного JPEG уходит в ноль.
    """
    lum = np.asarray(crop.convert("L"), dtype=np.float32)
    alpha = (cutoff - lum) / float(cutoff - ink)
    alpha = np.clip(alpha, 0.0, 1.0)
    alpha[lum > cutoff] = 0.0
    out = np.zeros(lum.shape + (4,), dtype=np.uint8)
    out[..., 0] = out[..., 1] = out[..., 2] = ink
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim_alpha(img, pad=0):
    box = img.split()[-1].getbbox()
    if not box:
        return img
    l, t, r, b = box
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(img.width, r + pad), min(img.height, b + pad)
    return img.crop((l, t, r, b))


def build_logo():
    src = Image.open(os.path.join(RAW, "logo-source.jpg")).convert("RGB")
    lum = np.asarray(src.convert("L"))
    ink_mask = lum < 160
    ys, xs = np.where(ink_mask)
    top, bottom = ys.min(), ys.max()

    # Пустая полоса между знаком и словесной частью — граница кропа.
    rows = ink_mask.sum(axis=1)
    split = next(i for i in range(top, bottom) if rows[i] == 0)

    lockup = logo_rgba(src.crop((0, top - 6, src.width, bottom + 8)))
    lockup = trim_alpha(lockup, pad=2)
    mark = logo_rgba(src.crop((0, top - 6, src.width, split)))
    mark = trim_alpha(mark, pad=2)

    lockup.save(os.path.join(BRAND, "logo-lockup.webp"), quality=95, method=6)
    mark.save(os.path.join(BRAND, "logo-mark.webp"), quality=95, method=6)

    # Favicon: знак на фирменном тёмном поле, без прозрачности.
    for size in (32, 180, 512):
        canvas = Image.new("RGBA", (size, size), (14, 16, 18, 255))
        pad = round(size * 0.06)
        fit = mark.resize((size - pad * 2, size - pad * 2), Image.LANCZOS)
        # На тёмном поле знак печатается светлым.
        arr = np.asarray(fit).copy()
        arr[..., 0], arr[..., 1], arr[..., 2] = 245, 246, 244
        arr[..., 3] = 255 - arr[..., 3]
        canvas.alpha_composite(Image.fromarray(arr, "RGBA"), (pad, pad))
        canvas.convert("RGB").save(os.path.join(BRAND, f"favicon-{size}.png"))

    print(f"logo: lockup {lockup.size}, mark {mark.size}")


# ─────────────────────────────  ТОВАРЫ  ─────────────────────────────

def drop_specks(mask, min_ratio=0.06):
    """Отсекает мелкие связные области непрозрачных пикселей.

    Кадры в прайсе обрезаны неаккуратно: у части фотографий по краю остаётся
    тёмная полоска, до которой заливка от границы не добирается. Такие полоски
    и одиночные точки заметно меньше самого товара и убираются по доле площади.
    Порог намеренно низкий: на части кадров в композиции несколько предметов,
    и терять их нельзя.
    """
    h, w = mask.shape
    seen = np.zeros((h, w), dtype=bool)
    blobs = []
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            cells = []
            while q:
                y, x = q.popleft()
                cells.append((y, x))
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            blobs.append(cells)

    if not blobs:
        return mask
    biggest = max(len(b) for b in blobs)
    keep = np.zeros((h, w), dtype=bool)
    for cells in blobs:
        if len(cells) >= biggest * min_ratio:
            ys, xs = zip(*cells)
            keep[np.array(ys), np.array(xs)] = True
    return keep


def ring(lum):
    """Яркости пикселей внешней рамки кадра."""
    return np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])


def trim_frame(img, max_trim=4):
    """Срезает тёмную рамку, которой обведена часть кадров в прайсе."""
    for _ in range(max_trim):
        lum = np.asarray(img.convert("L")).astype(np.int16)
        if min(lum.shape) < 12:
            break
        # Рамка заметно темнее фона, который занимает большую часть кадра.
        if np.median(ring(lum)) >= np.percentile(lum, 75) - 30:
            break
        img = img.crop((1, 1, img.width - 1, img.height - 1))
    return img


def cutout(img, inset=1):
    """Убирает фон, заливаясь от краёв, чтобы не пробить светлые детали товара."""
    img = trim_frame(img)

    # Часть кадров в прайсе снята на тёмном фоне. Вычитать его нельзя: заливка
    # съела бы сам товар, поэтому такие фотографии остаются как есть.
    if np.median(ring(np.asarray(img.convert("L")).astype(np.int16))) < 170:
        return img.convert("RGBA")

    if inset and img.width > inset * 2 and img.height > inset * 2:
        img = img.crop((inset, inset, img.width - inset, img.height - inset))
    rgb = img.convert("RGB")
    lum = np.asarray(rgb.convert("L")).astype(np.int16)
    h, w = lum.shape
    # Порог считается от реального фона кадра: у части фотографий он не белый,
    # а светло-серый, и фиксированное значение оставляло бы серую плашку.
    tol = int(np.median(ring(lum))) - 14
    bg = np.zeros((h, w), dtype=bool)
    q = deque()

    def push(y, x):
        if 0 <= y < h and 0 <= x < w and not bg[y, x] and lum[y, x] >= tol:
            bg[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)
    while q:
        y, x = q.popleft()
        push(y + 1, x)
        push(y - 1, x)
        push(y, x + 1)
        push(y, x - 1)

    solid = drop_specks(~bg)
    alpha = np.where(solid, 255, 0).astype(np.uint8)
    # Мягкая кромка: полупрозрачность на границе объекта.
    edge = solid & (lum >= tol - 18)
    alpha[edge] = 170

    out = np.dstack([np.asarray(rgb), alpha])
    return trim_alpha(Image.fromarray(out, "RGBA"), pad=1)


# Соответствие «файл в xlsx → модель» получено из xl/drawings/drawing*.xml
PRODUCT_MAP = {
    "EP830": "image62.jpeg",
    "EP820": "image9.jpeg",
    "EP801G2": "image12.jpeg",
    "EP804": "image8.jpeg",
    "EX620": "image7.jpeg",
    "EX605": "image2.jpeg",
    "EX603": "image1.jpeg",
    "ERO600G2": "image6.jpeg",
    "ES516": "image10.jpeg",
    "ES550": "image11.jpeg",
    "ES700": "image61.jpeg",
    "EB251-5": "image63.jpeg",
    "EB350": "image65.jpeg",
    "EB351": "image64.jpeg",
    "EB210KIT": "image69.jpeg",
    "MPK-3": "image43.jpeg",
    "PLATE-ROTARY": "image49.jpeg",
    "PLATE-DA": "image51.jpeg",
    "PAD-WOOL": "image53.jpeg",
    "PAD-MICROFIBER": "image30.jpeg",
    "PAD-FOAM": "image37.jpeg",
    "VPOLISH": "image22.jpeg",
    "HOLDER": "image18.jpeg",
    "CART": "image24.jpeg",
    "TOOLBAG": "image27.jpeg",
    "SHAFT": "image16.jpeg",
}


def build_products():
    manifest = {}
    for key, fname in PRODUCT_MAP.items():
        path = os.path.join(MEDIA, fname)
        if not os.path.exists(path):
            print(f"  ПРОПУСК {key}: нет {fname}")
            continue
        img = cutout(Image.open(path))
        base = key.lower()
        # Фотографии показываются в нативном размере: исходники из прайса
        # мелкие, и апскейл только выдал бы мыло.
        img.save(os.path.join(PRODUCTS, f"{base}.webp"), quality=92, method=6)
        manifest[key] = {"src": f"/products/{base}.webp", "w": img.width, "h": img.height}
        print(f"  {key:16} {fname:14} {img.width}x{img.height}")
    with open(os.path.join(PRODUCTS, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    ensure_dirs()
    build_logo()
    print("products:")
    build_products()
