#!/usr/bin/env python3
"""Rasterize the silent-launch 8-pointed mark to PNG (stdlib only)."""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

BG = (14, 26, 21)  # #0E1A15
GOLD = (201, 162, 39)  # #C9A227
ROOT = Path(__file__).resolve().parents[1]


def png_rgb(w: int, h: int, pixels: list[tuple[int, int, int]]) -> bytes:
    raw = bytearray()
    i = 0
    for _y in range(h):
        raw.append(0)
        for _x in range(w):
            r, g, b = pixels[i]
            raw.extend((r, g, b))
            i += 1

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(a[0] + (b[0] - a[0]) * t),
        int(a[1] + (b[1] - a[1]) * t),
        int(a[2] + (b[2] - a[2]) * t),
    )


def stamp_line(px: list[tuple[int, int, int]], w: int, h: int, x0: float, y0: float, x1: float, y1: float, thickness: float) -> None:
    steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
    r = thickness / 2
    for i in range(steps + 1):
        t = i / steps
        cx = x0 + (x1 - x0) * t
        cy = y0 + (y1 - y0) * t
        x_min = max(0, int(cx - r - 1))
        x_max = min(w - 1, int(cx + r + 1))
        y_min = max(0, int(cy - r - 1))
        y_max = min(h - 1, int(cy + r + 1))
        for y in range(y_min, y_max + 1):
            for x in range(x_min, x_max + 1):
                d = math.hypot(x - cx, y - cy)
                if d <= r:
                    cover = 1.0 if d <= r - 0.6 else max(0.0, 1.0 - (d - (r - 0.6)))
                    idx = y * w + x
                    px[idx] = blend(px[idx], GOLD, cover)


def square_pts(cx: float, cy: float, half: float, rot: float) -> list[tuple[float, float]]:
    pts = [(-half, -half), (half, -half), (half, half), (-half, half)]
    c, s = math.cos(rot), math.sin(rot)
    out = []
    for x, y in pts:
        out.append((cx + x * c - y * s, cy + x * s + y * c))
    return out


def draw_mark(w: int, h: int, *, full_bg: bool) -> list[tuple[int, int, int]]:
    if full_bg:
        px = [BG] * (w * h)
        # faint radial: center #14332A
        mid = (20, 51, 42)
        cx, cy = w / 2, h * 0.46
        maxd = math.hypot(w, h) * 0.55
        for y in range(h):
            for x in range(w):
                t = min(1.0, math.hypot(x - cx, y - cy) / maxd)
                px[y * w + x] = blend(mid, BG, t)
    else:
        px = [BG] * (w * h)

    cx, cy = w / 2, h / 2 if not full_bg else h * 0.46
    half = min(w, h) * (0.22 if full_bg else 0.32)
    thick = max(1.6, min(w, h) * 0.018)
    for rot in (0.0, math.pi / 4):
        pts = square_pts(cx, cy, half, rot)
        for i in range(4):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % 4]
            stamp_line(px, w, h, x0, y0, x1, y1, thick)
    return px


def write(path: Path, w: int, h: int, full_bg: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png_rgb(w, h, draw_mark(w, h, full_bg=full_bg)))
    print("wrote", path, w, "x", h)


def main() -> None:
    mark_dir = ROOT / "ios/App/App/Assets.xcassets/LaunchMark.imageset"
    write(mark_dir / "LaunchMark.png", 88, 88, False)
    write(mark_dir / "LaunchMark@2x.png", 176, 176, False)
    write(mark_dir / "LaunchMark@3x.png", 264, 264, False)

    brand = ROOT / "public/brand"
    write(brand / "silent-splash-mark-512.png", 512, 512, False)
    write(brand / "icon-512-maskable.png", 512, 512, True)
    write(brand / "silent-splash-390x844.png", 390, 844, True)
    write(brand / "silent-splash-390x844-dark.png", 390, 844, True)


if __name__ == "__main__":
    main()
