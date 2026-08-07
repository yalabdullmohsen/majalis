#!/usr/bin/env node
/**
 * يبني فهرس بحث موحّد وقت البناء → public/data/search/index.json
 * يغطي: علماء، كتب، سور (من بيانات المصدر في src/lib).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

const { SCHOLARS } = await import("../src/lib/scholars-data.ts");
const { LIBRARY_CATALOG } = await import("../src/lib/library-catalog.ts");
const { getSurahList } = await import("../src/lib/quran-api.ts");
const { normalizeArabic } = await import("../src/shared/arabic-normalize.ts");

/** @typedef {{ id: string, kind: string, titleAr: string, href: string, norm: string, meta?: string }} SearchDoc */

/** @type {SearchDoc[]} */
const docs = [];

for (const s of SCHOLARS) {
  const titleAr = s.name;
  docs.push({
    id: `scholar:${s.id}`,
    kind: "scholar",
    titleAr,
    href: `/scholars/${s.id}`,
    norm: normalizeArabic([s.name, s.fullName, s.era, ...(s.specialty ?? [])].join(" ")),
    meta: s.era,
  });
}

for (const b of LIBRARY_CATALOG) {
  docs.push({
    id: `book:${b.id}`,
    kind: "book",
    titleAr: b.title,
    href: `/library/${b.id}`,
    norm: normalizeArabic([b.title, b.author, b.category, ...(b.keywords ?? [])].join(" ")),
    meta: b.author,
  });
}

for (const s of getSurahList()) {
  docs.push({
    id: `surah:${s.number}`,
    kind: "surah",
    titleAr: `سورة ${s.name}`,
    href: `/mushaf/${s.number}`,
    norm: normalizeArabic(`سورة ${s.name} ${s.number}`),
    meta: `${s.ayahs} آية`,
  });
}

const outDir = path.join(appRoot, "public/data/search");
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: docs.length,
  docs,
};
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(payload));
console.log(`generate-unified-search-index: ${docs.length} docs`);
