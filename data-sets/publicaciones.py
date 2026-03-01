from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def scale(value: float, src_min: float, src_max: float, dst_min: float, dst_max: float) -> float:
    if src_max == src_min:
        return (dst_min + dst_max) / 2
    return dst_min + (value - src_min) * (dst_max - dst_min) / (src_max - src_min)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_candidates = [
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for font_path in font_candidates:
        if Path(font_path).exists():
            return ImageFont.truetype(font_path, size=size)
    return ImageFont.load_default()


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    input_path = base_dir / "publicaciones.json"
    output_path = base_dir / "publicaciones_por_anio.png"

    with input_path.open("r", encoding="utf-8-sig") as f:
        data = json.load(f)

    filtered = [row for row in data if int(row["Publication Year"]) >= 1990]
    years = [int(row["Publication Year"]) for row in filtered]
    counts = [int(row["Document Count"]) for row in filtered]

    width, height = 1700, 950
    margin_left, margin_right = 150, 70
    margin_top, margin_bottom = 120, 160

    plot_left = margin_left
    plot_right = width - margin_right
    plot_top = margin_top
    plot_bottom = height - margin_bottom

    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    title_font = load_font(40)
    axis_font = load_font(30)
    tick_font = load_font(20)

    title = "Número de publicaciones por año (desde 1990)"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_x = (width - (title_bbox[2] - title_bbox[0])) // 2
    draw.text((title_x, 28), title, fill="black", font=title_font)

    draw.line((plot_left, plot_top, plot_left, plot_bottom), fill="black", width=2)
    draw.line((plot_left, plot_bottom, plot_right, plot_bottom), fill="black", width=2)

    min_count = 0
    max_count = max(counts)

    y_ticks = 6
    for i in range(y_ticks + 1):
        y_value = min_count + (max_count - min_count) * i / y_ticks
        y = int(scale(y_value, min_count, max_count, plot_bottom, plot_top))
        draw.line((plot_left - 10, y, plot_left, y), fill="black", width=2)
        draw.line((plot_left, y, plot_right, y), fill="#e6e6e6", width=1)
        label = f"{int(y_value):,}"
        label_bbox = draw.textbbox((0, 0), label, font=tick_font)
        label_h = label_bbox[3] - label_bbox[1]
        draw.text((25, y - label_h // 2), label, fill="black", font=tick_font)

    x_step = max(1, len(years) // 10)
    for idx, year in enumerate(years):
        if idx % x_step == 0 or idx == len(years) - 1:
            x = int(scale(idx, 0, len(years) - 1, plot_left, plot_right))
            draw.line((x, plot_bottom, x, plot_bottom + 10), fill="black", width=2)
            year_label = str(year)
            year_bbox = draw.textbbox((0, 0), year_label, font=tick_font)
            year_w = year_bbox[2] - year_bbox[0]
            draw.text((x - year_w // 2, plot_bottom + 18), year_label, fill="black", font=tick_font)

    n = len(counts)
    slot_width = (plot_right - plot_left) / n
    bar_width = max(2, int(slot_width * 0.75))
    for idx, count in enumerate(counts):
        x_center = plot_left + (idx + 0.5) * slot_width
        x0 = int(x_center - bar_width / 2)
        x1 = int(x_center + bar_width / 2)
        y = int(scale(count, min_count, max_count, plot_bottom, plot_top))
        draw.rectangle((x0, y, x1, plot_bottom), fill="#1f77b4", outline="#1f77b4")

    x_axis_label = "Año"
    x_axis_bbox = draw.textbbox((0, 0), x_axis_label, font=axis_font)
    x_axis_w = x_axis_bbox[2] - x_axis_bbox[0]
    draw.text(((width - x_axis_w) // 2, height - 60), x_axis_label, fill="black", font=axis_font)
    draw.text((20, plot_top - 40), "Publicaciones", fill="black", font=axis_font)

    image.save(output_path)
    print(f"Plot guardado en: {output_path}")


if __name__ == "__main__":
    main()
