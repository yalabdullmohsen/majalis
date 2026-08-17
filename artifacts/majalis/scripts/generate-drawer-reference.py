#!/usr/bin/env python3
"""Reference 390×844 screenshots of the silent (unblurred) side drawer."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
W, H = 390, 844


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


def fill_rect(px, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            px[y * W + x] = color


def draw(dark: bool) -> list[tuple[int, int, int]]:
    page = (16, 22, 20) if dark else (242, 244, 243)
    scrim_mix = 0.45
    black = (0, 0, 0)
    panel = (18, 33, 28) if dark else (251, 251, 248)
    row = (29, 29, 27) if dark else (29, 29, 27)
    px = [blend(page, black, scrim_mix) for _ in range(W * H)]
    panel_w = 280
    fill_rect(px, W - panel_w, 0, W, H, panel)
    # readable rows (solid bars standing in for text — high contrast)
    ink = (237, 242, 240) if dark else (29, 29, 27)
    y = 56
    for _ in range(9):
        fill_rect(px, W - panel_w + 20, y, W - 20, y + 14, ink)
        y += 48
    return px


def main() -> None:
    brand = ROOT / "public/brand"
    brand.mkdir(parents=True, exist_ok=True)
    (brand / "drawer-open-390x844.png").write_bytes(png_rgb(W, H, draw(False)))
    (brand / "drawer-open-390x844-dark.png").write_bytes(png_rgb(W, H, draw(True)))
    print("wrote drawer reference PNGs")


if __name__ == "__main__":
    main()
