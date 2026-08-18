/**
 * بوابة انحدار: كاشف البكسل شبه الأبيض + طلاء #root في الصلاة.
 * تشغيل: node --import tsx src/lib/__tests__/chrome-no-white-strip.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WHITE_STRIP_MAX_RATIO, whitePixelRatio } from "../chrome-white-strip";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function paint(w, h, rgb) {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = rgb[0];
    buf[i * 4 + 1] = rgb[1];
    buf[i * 4 + 2] = rgb[2];
    buf[i * 4 + 3] = 255;
  }
  return buf;
}

{
  const green = paint(390, 220, [8, 26, 22]);
  assert.ok(whitePixelRatio(green, 390, 220) <= WHITE_STRIP_MAX_RATIO, "عيّنة زمرد تمرّ");
  const white = paint(390, 220, [255, 255, 255]);
  assert.ok(whitePixelRatio(white, 390, 220) > WHITE_STRIP_MAX_RATIO, "عيّنة بيضاء تفشل");
  const mixed = paint(390, 220, [8, 26, 22]);
  const stripRows = Math.ceil(220 * 0.05);
  for (let y = 220 - stripRows; y < 220; y++) {
    for (let x = 0; x < 390; x++) {
      const o = (y * 390 + x) * 4;
      mixed[o] = mixed[o + 1] = mixed[o + 2] = 250;
    }
  }
  assert.ok(whitePixelRatio(mixed, 390, 220) > WHITE_STRIP_MAX_RATIO, "شريط 5% أبيض يُرفض");
}

const css = readFileSync(resolve(root, "src/styles/pages/prayer-times.css"), "utf8");
assert.match(css, /html\.pts-immersive #root/);
assert.match(css, /min-height:\s*100svh[\s\S]*min-height:\s*100dvh/);

const chrome = readFileSync(resolve(root, "src/styles/components/app-chrome-scroll.css"), "utf8");
assert.match(chrome, /html:not\(\.pts-immersive\) #root/);
assert.match(chrome, /html:not\(\.pts-immersive\) \.app-shell/);

console.log("chrome-no-white-strip.test.ts: ok");
