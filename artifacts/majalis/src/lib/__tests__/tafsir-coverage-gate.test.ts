/**
 * بوابة: تغطية التفاسير المجمَّعة 6236 آية.
 * node --import tsx src/lib/__tests__/tafsir-coverage-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = resolve(root, "public/data/tafsir/tafsir-registry.json");
const DATA_DIR = resolve(root, "public/data/tafsir");
const FULL = 6236;

const SURAH_AYAH_COUNTS = [
  0, 7, 286, 200, 176, 120, 165, 206, 109, 123, 111, 52, 99, 123, 111, 128, 110, 165, 155, 98, 135, 112, 78,
  118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
  45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50,
  40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6,
  3, 5, 4, 5, 6,
];

async function countBundledAyahs(tafsirId: string): Promise<number> {
  const dir = resolve(DATA_DIR, tafsirId);
  let total = 0;
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const j = JSON.parse(await readFile(resolve(dir, f), "utf8")) as { ayahs?: Record<string, string> };
    total += Object.values(j.ayahs ?? {}).filter((t) => String(t).trim()).length;
  }
  return total;
}

async function assertSurahIntegrity(tafsirId: string): Promise<number> {
  let missing = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const file = resolve(DATA_DIR, tafsirId, `${String(surah).padStart(3, "0")}.json`);
    const j = JSON.parse(await readFile(file, "utf8")) as { ayahs?: Record<string, string> };
    const expected = SURAH_AYAH_COUNTS[surah] ?? 0;
    for (let ayah = 1; ayah <= expected; ayah += 1) {
      if (!j.ayahs?.[String(ayah)]?.trim()) missing += 1;
    }
  }
  return missing;
}

const registry = JSON.parse(await readFile(REGISTRY, "utf8")) as {
  tafsirs: Array<{ id: string; bundled?: boolean; coverage?: number }>;
};

const bundled = registry.tafsirs.filter((t) => t.bundled);
assert.ok(bundled.length >= 1, "سجل التفاسير يحدد bundled ≥1");

const report: Array<{ id: string; ayahs: number; missing: number; eligible: boolean }> = [];

for (const t of bundled) {
  const ayahs = await countBundledAyahs(t.id);
  const missing = await assertSurahIntegrity(t.id);
  const eligible = ayahs >= FULL && missing === 0;
  report.push({ id: t.id, ayahs, missing, eligible });
  if (t.coverage !== undefined) {
    assert.equal(
      t.coverage,
      ayahs,
      `registry coverage ${t.coverage} ≠ ملفات ${ayahs} لـ ${t.id}`,
    );
  }
}

console.log("tafsir-coverage report:", report);

const failed = report.filter((r) => !r.eligible);
if (failed.length) {
  console.warn(
    `[tafsir-coverage] غير مؤهل للعرض (يُستبعد تلقائياً): ${failed.map((f) => `${f.id} ${f.ayahs}/${FULL} missing=${f.missing}`).join(", ")}`,
  );
}

const ok = report.filter((r) => r.eligible);
if (!ok.length) {
  console.warn(
    `[tafsir-coverage] لا bundled كامل — UI يعتمد على تفاسير الشبكة (coverage=6236 في السجل)`,
  );
} else {
  console.log(`tafsir-coverage eligible bundled: ${ok.map((r) => r.id).join(", ")}`);
}

console.log("tafsir-coverage-gate.test.ts: ok");
