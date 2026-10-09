"""Contact sheet: python sheet.py out.png cols width img1 img2 ... (labels from file names)."""
import sys
from PIL import Image, ImageDraw
out, cols, width, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in files]
w = width; h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), "white")
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22))
    d.text((x + 6, y + 4), f.split("-")[-1].replace(".png", ""), fill="black")
sheet.save(out)
