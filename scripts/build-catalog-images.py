#!/usr/bin/env python3
"""
Готовит фотографии каталога из официальных рендеров shinemate.com.

Вход:  assets/raw/official/*.png|jpg + index.json (выгрузка каталога вендора)
Выход: public/catalog/<slug>.webp — прозрачный фон, обрезанные поля, ≤800 px

Файлы вендора уже сняты на прозрачном фоне в 400–960 px, поэтому вырезать
фон и апскейлить ничего не нужно: достаточно обрезать пустые поля и сжать.
"""
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "raw", "official")
OUT = os.path.join(ROOT, "public", "catalog")
MAX_SIDE = 700
THUMB_SIDE = 300

# id вендора → slug, под которым фотография лежит в public/catalog
SLUGS = {
    # Роторные машины
    "48": "ep820", "67": "ep801", "17": "ep802", "42": "ep803", "103": "ep804",
    "50": "ep809",
    # Эксцентриковые
    "16": "ex620", "33": "ex605", "34": "ex603", "32": "ex610", "84": "ero600g2",
    # Шлифование
    "60": "es516", "71": "es550", "97": "es700", "70": "es502", "91": "es517",
    "94": "es526", "95": "es527", "90": "sanding-block",
    # Аккумуляторные
    "19": "eb251", "107": "eb230", "2": "eb351-5", "18": "eb351-3", "22": "eb350-5",
    "21": "eb350-3", "73": "eb210", "105": "eb212", "106": "eb213", "92": "eb200a",
    "24": "battery-18v", "75": "battery-108v", "23": "charger-18v", "76": "charger-108v",
    # Подложки и адаптеры
    "45": "plate-flexedge", "43": "plate-flexedge-small", "47": "plate-multihole",
    "85": "plate-sanding", "86": "plate-square", "87": "plate-square-multihole",
    "88": "interface-pad", "89": "velcro-protector",
    # Круги
    "52": "foam-diamond-t10", "53": "foam-diamond-t40", "55": "foam-diamond-t60",
    "54": "foam-diamond-t80", "56": "foam-diamond-t120",
    "64": "foam-flat-t10", "65": "foam-flat-t40", "66": "foam-flat-t60",
    "68": "foam-flat-t80", "69": "foam-flat-t120",
    "58": "wool-t140", "59": "wool-t160", "63": "wool-t130", "104": "wool-lambswool",
    "62": "microfiber-t100", "61": "microfiber-t20",
    "51": "mpk3",
    # Химия
    "40": "v82", "37": "v20", "39": "v80", "38": "v40",
    # Оснащение поста
    "29": "tool-cart", "9": "tool-bag", "41": "tool-box", "30": "polisher-hanger",
    "27": "pegboard", "28": "pegboard-hooks", "31": "stool", "20": "apron",
    "35": "bucket", "36": "grit-separator", "26": "towel",
    "111": "vac40", "113": "ec405", "112": "ec400",
}


def main():
    os.makedirs(OUT, exist_ok=True)
    index = json.load(open(os.path.join(SRC, "index.json"), encoding="utf-8"))
    manifest = {}

    for pid, slug in SLUGS.items():
        path = None
        for ext in (".png", ".jpg", ".jpeg"):
            candidate = os.path.join(SRC, pid + ext)
            if os.path.exists(candidate):
                path = candidate
                break
        if not path:
            print(f"  НЕТ ИСХОДНИКА {slug} (id {pid})")
            continue

        img = Image.open(path).convert("RGBA")
        box = img.split()[-1].getbbox()
        if box:
            img = img.crop(box)
        if max(img.size) > MAX_SIDE:
            k = MAX_SIDE / max(img.size)
            img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)

        img.save(os.path.join(OUT, f"{slug}.webp"), quality=82, method=6)

        # Отдельная миниатюра для карточек: в сетке фотография занимает
        # около 300 px, тянуть туда полноразмерный файл незачем.
        k = THUMB_SIDE / max(img.size)
        thumb = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
        thumb.save(os.path.join(OUT, f"{slug}-thumb.webp"), quality=80, method=6)

        manifest[slug] = {
            "w": img.width,
            "h": img.height,
            "source": index.get(pid, {}).get("name", ""),
        }
        print(f"  {slug:26} {img.width}x{img.height}  ←  {index.get(pid, {}).get('name', '?')}")

    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"готово: {len(manifest)} фотографий")


if __name__ == "__main__":
    main()
