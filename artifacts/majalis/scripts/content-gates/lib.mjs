/**
 * أدوات مشتركة لبوابات محتوى المعرفة — تطبيع عربي + تحميل المصحف.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const KNOWLEDGE = path.join(ROOT, "public/data/knowledge");
export const QURAN_DIR = path.join(ROOT, "public/data/quran");
export const SCHEMAS = path.join(ROOT, "data/schemas");

const DIAC = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** تطبيع صارم لمطابقة الآيات حرفياً بعد إزالة التشكيل. */
export function normAyah(t) {
  return String(t || "")
    .replace(/\uFEFF/g, "")
    .replace(/\u0640/g, "")
    .replace(/وٰ/g, "ا")
    .replace(/ٰ/g, "ا")
    .replace(/[ٕٓٔ]/g, "")
    .replace(DIAC, "")
    .replace(/بصۜ?ط/g, "بسط")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي]/g, "");
}

/** تطبيع متسامح لكشف التكرار والبحث. */
export function softNorm(t) {
  return normAyah(t).replace(/[اءئؤ]/g, "ا");
}

export function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

let _quranCache = null;
export function loadQuran() {
  if (_quranCache) return _quranCache;
  const surahs = [];
  for (let i = 1; i <= 114; i++) {
    const d = JSON.parse(
      fs.readFileSync(path.join(QURAN_DIR, `surah-${String(i).padStart(3, "0")}.json`), "utf8"),
    );
    surahs.push({
      number: i,
      name: d.name,
      revelationType: d.revelationType,
      numberOfAyahs: d.numberOfAyahs,
      ayahs: d.ayahs.map((a) => ({
        number: a.numberInSurah || a.number,
        text: a.text.replace(/^\uFEFF/, ""),
        norm: normAyah(a.text),
      })),
    });
  }
  _quranCache = {
    surahs,
    byRef: new Map(),
    corpus: surahs.map((s) => s.ayahs.map((a) => a.norm).join("")).join(""),
  };
  for (const s of surahs) {
    for (const a of s.ayahs) {
      _quranCache.byRef.set(`${s.number}:${a.number}`, a);
    }
  }
  return _quranCache;
}

export function getAyah(surah, ayah) {
  const q = loadQuran();
  return q.byRef.get(`${surah}:${ayah}`) || null;
}

export function ayahExactMatch(text) {
  const n = normAyah(text);
  if (n.length < 8) return { ok: true, reason: "too-short" };
  const q = loadQuran();
  if (q.corpus.includes(n)) return { ok: true };
  return { ok: false, norm: n };
}

export function wordCount(t) {
  return String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function loadKnowledgeItems() {
  const files = walkJson(KNOWLEDGE).filter((f) => !f.endsWith("manifest.json"));
  const items = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, "utf8"));
    const arr = Array.isArray(raw) ? raw : raw.items ? raw.items : [raw];
    for (const it of arr) {
      if (it && typeof it === "object" && it.id) {
        items.push({ ...it, __file: path.relative(ROOT, f) });
      }
    }
  }
  return items;
}

export function fail(msg, details = []) {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`);
  for (const d of details.slice(0, 40)) console.error("  -", d);
  if (details.length > 40) console.error(`  … و${details.length - 40} أخرى`);
  process.exit(1);
}

export function ok(msg) {
  console.log(`\x1b[32m✓ ${msg}\x1b[0m`);
}
