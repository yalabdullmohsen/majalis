/**
 * بوابة: مراجع القراءة تعرض numberInSurah لا المعرّف العالمي.
 * تشغيل: node --import tsx src/lib/__tests__/ayah-ref-normalize-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  globalAyahToSurahAyah,
  normalizeAyahKey,
  normalizeSurahAyah,
} from "../ayah-ref-normalize";

console.log("=== normalizeSurahAyah clamps within surah ===");
{
  assert.deepEqual(normalizeSurahAyah(2, 255), { surah: 2, ayah: 255 });
  assert.deepEqual(normalizeSurahAyah(1, 7), { surah: 1, ayah: 7 });
  assert.deepEqual(normalizeSurahAyah(2, 286), { surah: 2, ayah: 286 });
}

console.log("=== global id 689 never shown as البقرة آية 689 ===");
{
  const n = normalizeSurahAyah(2, 689);
  assert.notEqual(n.ayah, 689, "لا رقم عالمي في العرض");
  assert.ok(n.ayah <= 286 || n.surah !== 2, "لا تجاوز لعدد آيات البقرة");
  const g = globalAyahToSurahAyah(689);
  assert.deepEqual(n, g);
  assert.equal(normalizeAyahKey("2:689"), `${g.surah}:${g.ayah}`);
  assert.notEqual(g.ayah, 689, "global 689 must never display as local ayah 689");
}

console.log("=== Open mushaf card uses normalize ===");
{
  const { readFileSync } = await import("node:fs");
  const { dirname, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const card = readFileSync(resolve(root, "src/components/quran/QuranOpenMushafCard.tsx"), "utf8");
  assert.match(card, /normalizeAyahKey|normalizeSurahAyah/);
  const dash = readFileSync(resolve(root, "src/components/HomeDashboard.tsx"), "utf8");
  assert.match(dash, /normalizeSurahAyah/);
  // وحدة خفيفة منفصلة — لا تُسحب عبر quran-api حتى لا تتجاوز ميزانية الحزمة
  const norm = readFileSync(resolve(root, "src/lib/ayah-ref-normalize.ts"), "utf8");
  assert.match(norm, /export function normalizeAyahKey/);
  assert.match(norm, /export function globalAyahToSurahAyah/);
  const api = readFileSync(resolve(root, "src/lib/quran-api.ts"), "utf8");
  assert.doesNotMatch(api, /from ["']\.\/ayah-ref-normalize["']/);
}

console.log("ayah-ref-normalize-gate.test.ts: ok");
