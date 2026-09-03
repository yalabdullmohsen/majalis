/**
 * بحث محلي من public/data/search/index.json — fallback/primary لـ /api/search
 * عندما Supabase فارغ أو غير متاح.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.resolve(__dirname, "../public/data/search/index.json");

/** @type {{ version: number; docs: Array<{ id: string; kind: string; titleAr: string; href: string; norm: string; meta?: string }> } | null} */
let cache = null;

const DIGIT_MAP = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

export function normalizeArabic(text) {
  if (!text) return "";
  let s = String(text);
  s = s.replace(/[٠-٩۰-۹]/g, (ch) => DIGIT_MAP[ch] ?? ch);
  s = s
    .replace(/[ً-ٟؐ-ؚۖ-ۜ۟-ۤۧ-ٰۭـ]/g, "")
    .replace(/[أإآٱٲٳ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ىئی]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ک/g, "ك")
    .replace(/ء/g, "")
    .replace(/ـ/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, "")
    .replace(/[,.;:!?،؛؟«»""''()[\]{}\-—…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

function stripAl(n) {
  return n.startsWith("ال") ? n.slice(2) : n;
}

function scoreDoc(docNorm, qNorm) {
  if (!qNorm) return null;
  const hay = docNorm;
  const q = qNorm;
  const qBare = stripAl(q);
  const hayBare = stripAl(hay);

  if (hay === q || hayBare === qBare || hay.includes(q) || hayBare.includes(qBare)) {
    return { rank: 0, dist: 0 };
  }
  if (hay.startsWith(q) || hayBare.startsWith(qBare)) {
    return { rank: 1, dist: 0 };
  }
  const words = q.split(" ").filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w) || hay.includes(stripAl(w)))) {
    return { rank: 2, dist: words.length };
  }
  for (const w of hay.split(" ")) {
    if (w.startsWith(q) || w.startsWith(qBare) || stripAl(w).startsWith(qBare)) {
      return { rank: 2, dist: 1 };
    }
  }
  return null;
}

const KIND_TO_API = {
  book: "library",
  surah: "quran",
  tafsir: "quran",
  lesson: "lesson",
  hadith: "hadith",
  adhkar: "adhkar",
  dua: "adhkar",
  scholar: "scholar",
  sheikh: "scholar",
  fiqh: "fiqh",
  qa: "qa",
  fawaid: "fawaid",
  story: "story",
  course: "lesson",
  app: "page",
  settings: "page",
  history: "story",
  nation: "story",
  prophet: "story",
  person: "story",
  seerah: "story",
};

function toApiResult(doc) {
  const type = KIND_TO_API[doc.kind] ?? doc.kind;
  return {
    id: doc.id,
    type,
    title: doc.titleAr,
    summary: doc.meta || "",
    meta: doc.meta || "",
    href: doc.href,
    source: "static_index",
  };
}

/** اقتراحات ثابتة عند انعدام النتائج — كلمات إسلامية شائعة */
const CURATED = {
  الصلاه: [
    { id: "cur:salah-guide", type: "fiqh", title: "دليل الصلاة", summary: "أحكام وخطوات الصلاة", href: "/salah-guide" },
    { id: "cur:prayer-times", type: "page", title: "مواقيت الصلاة", summary: "الصلاة القادمة والعدّ التنازلي", href: "/prayer-times" },
    { id: "cur:adhkar-salah", type: "adhkar", title: "أذكار الصلاة", summary: "أذكار قبل وبعد الصلاة", href: "/adhkar/salah" },
  ],
  الحديث: [
    { id: "cur:hadith", type: "hadith", title: "الأحاديث النبوية", summary: "فهرس الأحاديث مع التخريج", href: "/hadith" },
    { id: "cur:hadith-sahih", type: "hadith", title: "الأحاديث الصحيحة", summary: "أحاديث صحيحة للعمل", href: "/hadith/sahih" },
    { id: "cur:arbaeen", type: "hadith", title: "الأربعون النووية", summary: "أربعون حديثًا نبويًا", href: "/arbaeen-nawawi" },
  ],
  الوضوء: [
    { id: "cur:wudu", type: "fiqh", title: "الوضوء", summary: "أحكام الوضوء", href: "/wudu-guide" },
    { id: "cur:adhkar-wudu", type: "adhkar", title: "أذكار الوضوء", summary: "ما يُقال عند الوضوء", href: "/adhkar/wudu" },
  ],
  الزكاه: [
    { id: "cur:zakat", type: "fiqh", title: "الزكاة", summary: "أحكام الزكاة", href: "/zakat" },
  ],
  الصيام: [
    { id: "cur:fasting", type: "fiqh", title: "الصيام", summary: "أحكام الصيام", href: "/fasting" },
  ],
  القران: [
    { id: "cur:mushaf", type: "quran", title: "المصحف الشريف", summary: "قراءة القرآن", href: "/mushaf" },
    { id: "cur:quran-hub", type: "quran", title: "مركز القرآن", summary: "تلاوة وتفسير وعلوم", href: "/quran-hub" },
  ],
  البخاري: [
    { id: "cur:bukhari", type: "hadith", title: "صحيح البخاري", summary: "أحاديث من صحيح البخاري", href: "/hadith/books/bukhari" },
    { id: "cur:hadith", type: "hadith", title: "الأحاديث", summary: "فهرس الحديث", href: "/hadith" },
  ],
  "اذكار الصباح": [
    { id: "cur:morning", type: "adhkar", title: "أذكار الصباح", summary: "أذكار ما بعد الفجر", href: "/adhkar/morning" },
  ],
};

export function loadStaticSearchIndex() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf8");
    const json = JSON.parse(raw);
    if (!Array.isArray(json.docs) || json.docs.length === 0) {
      cache = { version: 0, docs: [] };
      return cache;
    }
    cache = json;
    return cache;
  } catch {
    cache = { version: 0, docs: [] };
    return cache;
  }
}

export function searchStaticIndex(rawQuery, limit = 40) {
  const qNorm = normalizeArabic(rawQuery);
  if (!qNorm || qNorm.length < 2) {
    return { results: [], groups: {}, total: 0, normalized: qNorm };
  }

  const { docs } = loadStaticSearchIndex();
  /** @type {Array<{ doc: typeof docs[0]; score: { rank: number; dist: number } }>} */
  const scored = [];

  for (const doc of docs) {
    const m = scoreDoc(doc.norm || normalizeArabic(doc.titleAr), qNorm);
    if (m) scored.push({ doc, score: m });
  }

  scored.sort((a, b) => {
    if (a.score.rank !== b.score.rank) return a.score.rank - b.score.rank;
    if (a.score.dist !== b.score.dist) return a.score.dist - b.score.dist;
    return a.doc.titleAr.localeCompare(b.doc.titleAr, "ar");
  });

  let results = scored.slice(0, limit).map(({ doc }) => toApiResult(doc));

  if (results.length === 0) {
    const key = Object.keys(CURATED).find((k) => {
      const kn = normalizeArabic(k);
      return qNorm.includes(kn) || kn.includes(qNorm) || qNorm === kn;
    });
    if (key) {
      results = CURATED[key].slice(0, limit);
    }
  }

  const groups = {};
  for (const item of results) {
    (groups[item.type] ??= []).push(item);
  }

  return { results, groups, total: results.length, normalized: qNorm };
}
