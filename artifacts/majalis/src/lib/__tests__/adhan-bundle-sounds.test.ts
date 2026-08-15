/**
 * لا تُضمَّن في الحزمة إلا مقاطع محدودة الحجم تحت /sounds و /audio.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-bundle-sounds.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const soundsDir = resolve(__dirname, "../../../public/sounds/adhan");
const audioDir = resolve(__dirname, "../../../public/audio/adhan");

assert.ok(existsSync(soundsDir), "مجلد public/sounds/adhan موجود");
assert.ok(existsSync(audioDir), "مجلد public/audio/adhan موجود");

function assertDirBudget(dir: string, label: string): number {
  const entries = readdirSync(dir).filter((n) => !n.startsWith(".") && n !== "README.md");
  let total = 0;
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (!st.isFile()) continue;
    assert.ok(
      !/\.(mp3|m4a|aac|wav|caf)$/i.test(name) || st.size < 500_000,
      `ملف كبير غير مسموح في الحزمة: ${label}/${name} (${st.size} بايت)`,
    );
    total += st.size;
  }
  assert.ok(total < 2_000_000, `حجم مجلد ${label} ${total} يتجاوز 2 ميغابايت`);
  return total;
}

const soundsBytes = assertDirBudget(soundsDir, "sounds/adhan");
const audioBytes = assertDirBudget(audioDir, "audio/adhan");

const requiredFull = [
  "adhan-makkah-full.mp3",
  "adhan-madinah-full.mp3",
  "adhan-egypt-full.mp3",
];
for (const name of requiredFull) {
  assert.ok(existsSync(join(audioDir, name)), `مطلوب: audio/adhan/${name}`);
}

console.log(
  `adhan-bundle-sounds.test.ts: ok (sounds=${soundsBytes} audio=${audioBytes})`,
);
