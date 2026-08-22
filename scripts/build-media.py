#!/usr/bin/env python3
"""
Оптимизирует cinematic-ассеты, сгенерированные через Higgsfield, под веб.

Вход:  assets/raw/hf/*.png (2K, PNG)
Выход: public/media/*.webp в нескольких ширинах + постеры

Отдельно собирается пара «до / после» для сцены с курсорным раскрытием:
«после» — исходный кадр глубокого глянца, «до» — тот же кадр с добавленными
голограммами и мутью. Пара получается идеально совмещённой, потому что это
одна и та же поверхность; дефекты добавляются, а не «снимаются».
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HF = os.path.join(ROOT, "assets", "raw", "hf")
OUT = os.path.join(ROOT, "public", "media")

WIDTHS = (1920, 1280, 800)


def emit(img, name, widths=WIDTHS, quality=82):
    img = img.convert("RGB")
    for w in widths:
        if w > img.width:
            continue
        h = round(img.height * w / img.width)
        img.resize((w, h), Image.LANCZOS).save(
            os.path.join(OUT, f"{name}-{w}.webp"), quality=quality, method=6
        )
    # Постер: крошечный размытый кадр, показывается пока грузится основной.
    poster = img.resize((32, max(1, round(32 * img.height / img.width))), Image.LANCZOS)
    poster = poster.resize((320, max(1, round(320 * img.height / img.width))), Image.BICUBIC)
    poster.filter(ImageFilter.GaussianBlur(6)).save(
        os.path.join(OUT, f"{name}-poster.webp"), quality=60, method=6
    )
    print(f"  {name}: {img.width}x{img.height} → {', '.join(str(w) for w in widths if w <= img.width)}")


def add_swirls(img, center=(0.40, 0.74), count=2600, seed=7):
    """Добавляет на глянец голограммы и лёгкую муть — состояние «до» обработки."""
    rnd = random.Random(seed)
    w, h = img.size
    cx, cy = center[0] * w, center[1] * h

    layer = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(layer)
    max_r = math.hypot(max(cx, w - cx), max(cy, h - cy))
    for _ in range(count):
        r = rnd.uniform(0.05, 1.0) ** 0.65 * max_r
        span = rnd.uniform(1.6, 7.0)
        start = rnd.uniform(0, 360)
        box = (cx - r, cy - r, cx + r, cy + r)
        if box[2] - box[0] < 2:
            continue
        draw.arc(box, start, start + span, fill=rnd.randint(120, 255), width=1)
    layer = layer.filter(ImageFilter.GaussianBlur(0.7))

    base = np.asarray(img.convert("RGB"), dtype=np.float32)
    scratch = np.asarray(layer, dtype=np.float32)[..., None] / 255.0

    lum = base.mean(axis=2, keepdims=True) / 255.0
    # Голограммы видно только в тёмных зонах — на пересвете они тонут.
    visibility = np.clip(1.0 - lum * 1.6, 0.0, 1.0)
    out = base + scratch * visibility * 165.0

    # Общая муть: поднятые чёрные и срезанный контраст.
    out = out * 0.87 + 27.0
    out = np.clip(out, 0, 255).astype(np.uint8)

    hazed = Image.fromarray(out, "RGB")
    # Мягкое свечение вокруг источника света — типичный вид неотполированного лака.
    bloom = hazed.filter(ImageFilter.GaussianBlur(14))
    return Image.blend(hazed, bloom, 0.22)


def main():
    os.makedirs(OUT, exist_ok=True)
    print("media:")

    emit(Image.open(os.path.join(HF, "hero-01.png")), "hero")
    emit(Image.open(os.path.join(HF, "product-01.png")), "product", widths=(1600, 1000, 640))
    emit(Image.open(os.path.join(HF, "stage-01.png")), "stage", widths=(1920, 1280, 800))

    gloss = Image.open(os.path.join(HF, "gloss-01.png")).convert("RGB")
    emit(gloss, "surface-after", widths=(1920, 1280, 800), quality=86)
    emit(add_swirls(gloss), "surface-before", widths=(1920, 1280, 800), quality=86)


if __name__ == "__main__":
    main()
