"""Compress AICG infographic PNGs to WebP: tasks/img/<D>-<T>.webp.
Usage: python scripts/png2webp.py <AICG folder>     (needs Pillow: pip install pillow)"""
import re, sys, pathlib
from PIL import Image
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(__file__).resolve().parent.parent / "tasks" / "img"
out.mkdir(parents=True, exist_ok=True)
total = 0
for p in sorted(src.glob("*.png")):
    m = re.match(r"^(\d)-(\d)_", p.name)
    if not m:
        sys.exit(f"ERROR: PNG without task prefix: {p.name}")
    im = Image.open(p).convert("RGB")
    if im.width > 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    dst = out / f"{m.group(1)}-{m.group(2)}.webp"
    im.save(dst, "WEBP", quality=80, method=6)
    total += dst.stat().st_size
    print(f"{p.name} -> {dst.name} {dst.stat().st_size//1024}KB")
print(f"total {total/1048576:.1f} MB")
