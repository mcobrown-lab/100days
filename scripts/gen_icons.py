from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (20, 24, 34, 255)      # dark slate
ACCENT = (56, 189, 152, 255)  # teal-green (progress color)
TEXT = (245, 247, 250, 255)

def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.08) if maskable else 0
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=int(size*0.22), fill=BG)

    # progress ring arc representing "day X of 100"
    ring_pad = int(size * 0.14) + pad
    bbox = [ring_pad, ring_pad, size - ring_pad, size - ring_pad]
    draw.arc(bbox, start=-90, end=270, fill=(60, 66, 80, 255), width=max(2, int(size*0.045)))
    draw.arc(bbox, start=-90, end=180, fill=ACCENT, width=max(2, int(size*0.045)))

    text = "100"
    font_size = int(size * 0.30)
    font = None
    for name in ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"]:
        try:
            font = ImageFont.truetype(name, font_size)
            break
        except Exception:
            continue
    if font is None:
        font = ImageFont.load_default()

    tb = draw.textbbox((0, 0), text, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text(((size - tw) / 2 - tb[0], (size - th) / 2 - tb[1]), text, fill=TEXT, font=font)

    return img

for size in [192, 512]:
    make_icon(size).save(os.path.join(OUT_DIR, f"icon-{size}.png"))

make_icon(512, maskable=True).save(os.path.join(OUT_DIR, "icon-512-maskable.png"))

print("Icons written to", OUT_DIR)
