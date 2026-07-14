#!/usr/bin/env node
/**
 * فحص سلامة فهرس المكتبة — src/data/library-catalog.json
 *
 * يفشل الاختبار إذا:
 *  1. وُجد معرّفان مكرران (id أو slug).
 *  2. وُجد عنوانان مطبَّعان متطابقان لنفس المؤلف المطبَّع (تكرار محتوى).
 *  3. وُجد كتاب بلا عنوان أو بلا مؤلف.
 *  4. وُجد verificationStatus: "verified" بلا sources.
 *  5. وُجدت عبارة مبالغ فيها بلا مصدر في أي وصف.
 *
 * التشغيل: node scripts/test-library-integrity.mjs
 * ويصدّر أيضًا دوال التطبيع لإعادة استخدامها في أدوات الفحص والدمج.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const CATALOG_PATH = resolve(APP_ROOT, "src/data/library-catalog.json");
const AUTHORS_PATH = resolve(APP_ROOT, "src/data/library-authors.json");
const REDIRECTS_PATH = resolve(HERE, "redirects.books.json");

/* ================================================================== */
/* التطبيع العربي — مصدر واحد يستخدمه الكاشف والاختبار                */
/* ================================================================== */

/** التشكيل والعلامات الفوقية + الكشيدة */
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/** ترقيم وفواصل تُستبدل بمسافة */
const PUNCTUATION = /[«»"'”“‘’()[\]{}—–\-_.,;:!?؟،؛/\\|]/g;

/** كلمات وظيفية تُحذف عند تطبيع العنوان */
export const TITLE_STOPWORDS = ["في", "من", "على", "شرح", "كتاب"];

/** ألقاب تُحذف عند تطبيع اسم المؤلف */
export const AUTHOR_HONORIFICS = [
  "شيخ الإسلام",
  "حجة الإسلام",
  "ولي الدين",
  "الإمام",
  "الشيخ",
  "الحافظ",
  "العلامة",
];

/** توحيد الحروف العربية وإزالة التشكيل والترقيم */
export function normalizeArabic(input) {
  if (!input) return "";
  return String(input)
    .replace(DIACRITICS, "")
    .replace(/ﷺ/g, " ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * تطبيع العنوان: إزالة التشكيل والكشيدة، حذف «ال» التعريف،
 * توحيد الحروف، ثم حذف الكلمات الوظيفية.
 * ملاحظة: تُقتطع «ال» قبل توحيد الهمزات حتى لا تُبتر «أل» من «ألفية».
 */
export function normalizeTitle(input) {
  if (!input) return "";
  const stopwords = new Set(TITLE_STOPWORDS.map((word) => normalizeArabic(word)));

  return String(input)
    .replace(DIACRITICS, "")
    .replace(/ﷺ/g, " ")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word.startsWith("ال") && word.length > 3 ? word.slice(2) : word))
    .map((word) => normalizeArabic(word))
    .filter((word) => word && !stopwords.has(word))
    .join(" ");
}

/** تطبيع اسم المؤلف: توحيد الحروف + حذف الألقاب */
export function normalizeAuthor(input) {
  if (!input) return "";
  let value = normalizeArabic(input);
  for (const honorific of AUTHOR_HONORIFICS) {
    value = value.split(normalizeArabic(honorific)).join(" ");
  }
  return value.replace(/\s+/g, " ").trim();
}

/* ================================================================== */
/* عبارات مبالغ فيها بلا مصدر — ممنوعة في الأوصاف                     */
/* ================================================================== */
export const OVERCLAIM_PHRASES = [
  "أهم كتاب",
  "أفضل كتاب",
  "أعظم كتاب",
  "أدق ما كُتب",
  "أدق وأجمع",
  "لا غنى عنه",
  "لا نظير له",
  "المرجع الأول",
  "الأشمل",
  "أشمل موسوعة",
  "بلا منازع",
];

/* ================================================================== */
/* الفحص                                                              */
/* ================================================================== */
async function main() {
  const failures = [];
  const warnings = [];
  const fail = (rule, message) => failures.push(`[${rule}] ${message}`);

  const books = JSON.parse(await readFile(CATALOG_PATH, "utf8"));

  if (!Array.isArray(books)) {
    console.error("❌ library-catalog.json يجب أن يكون مصفوفة كتب في المستوى الأعلى.");
    process.exit(1);
  }

  /* 1) معرّفات مكررة ----------------------------------------------- */
  const seenIds = new Map();
  const seenSlugs = new Map();
  for (const book of books) {
    if (!book.id) {
      fail("DUP_ID", `كتاب بلا معرّف: ${JSON.stringify(book.title ?? book)}`);
      continue;
    }
    if (seenIds.has(book.id)) fail("DUP_ID", `معرّف مكرر: ${book.id}`);
    seenIds.set(book.id, book);

    if (book.slug) {
      if (seenSlugs.has(book.slug)) fail("DUP_SLUG", `slug مكرر: ${book.slug}`);
      seenSlugs.set(book.slug, book);
      if (book.slug !== book.id) {
        fail("SLUG_MISMATCH", `slug (${book.slug}) لا يساوي المعرّف (${book.id}).`);
      }
    }
  }

  /* 2) عنوان مطبَّع متطابق لنفس المؤلف المطبَّع ---------------------- */
  const byTitleAuthor = new Map();
  for (const book of books) {
    const nTitle = book.normalizedTitle || normalizeTitle(book.title);
    const nAuthor = normalizeAuthor(book.author);
    const key = `${nTitle}|||${nAuthor}`;
    const existing = byTitleAuthor.get(key);
    if (existing) {
      fail(
        "DUP_CONTENT",
        `تكرار محتوى: «${book.title}» (${book.id}) و«${existing.title}» (${existing.id}) — العنوان والمؤلف المطبَّعان متطابقان.`
      );
    } else {
      byTitleAuthor.set(key, book);
    }
  }

  /* 2ب) اتساق معرّف المؤلف (تحذير) ---------------------------------- */
  const authorIdByNormalized = new Map();
  for (const book of books) {
    if (!book.authorId) continue;
    const nAuthor = normalizeAuthor(book.author);
    const existing = authorIdByNormalized.get(nAuthor);
    if (existing && existing !== book.authorId) {
      warnings.push(
        `معرّف مؤلف غير متسق: «${book.author}» مرتبط بـ ${existing} و ${book.authorId} (${book.id}).`
      );
    } else if (!existing) {
      authorIdByNormalized.set(nAuthor, book.authorId);
    }
  }

  /* 3) عنوان أو مؤلف ناقص ------------------------------------------ */
  for (const book of books) {
    if (!book.title || !String(book.title).trim()) {
      fail("MISSING_TITLE", `كتاب بلا عنوان: ${book.id}`);
    }
    if (!book.author || !String(book.author).trim()) {
      fail("MISSING_AUTHOR", `كتاب بلا مؤلف: ${book.id}`);
    }
  }

  /* 4) verified بلا مصادر ------------------------------------------ */
  for (const book of books) {
    if (book.verificationStatus === "verified") {
      if (!Array.isArray(book.sources) || book.sources.length === 0) {
        fail("VERIFIED_NO_SOURCES", `${book.id} موسوم verified بلا sources.`);
      }
    }
    if (Array.isArray(book.editions)) {
      for (const edition of book.editions) {
        if (edition?.verificationStatus === "verified" && !edition.sourceUrl && !edition.isbn) {
          fail(
            "VERIFIED_NO_SOURCES",
            `طبعة «${edition.editionId ?? "?"}» في ${book.id} موسومة verified بلا sourceUrl أو isbn.`
          );
        }
      }
    }
  }

  /* 5) عبارات مبالغ فيها ------------------------------------------- */
  const overclaims = OVERCLAIM_PHRASES.map((phrase) => ({
    raw: phrase,
    norm: normalizeArabic(phrase),
  }));
  for (const book of books) {
    const description = normalizeArabic(book.description || "");
    for (const phrase of overclaims) {
      if (description.includes(phrase.norm)) {
        fail("OVERCLAIM", `${book.id} — الوصف يحتوي عبارة مبالغ فيها: «${phrase.raw}».`);
      }
    }
  }

  /* فحوص مساندة ----------------------------------------------------- */
  try {
    const authors = JSON.parse(await readFile(AUTHORS_PATH, "utf8"));
    const authorIds = new Set(authors.map((author) => author.id));
    for (const book of books) {
      if (book.authorId && !authorIds.has(book.authorId)) {
        fail("UNKNOWN_AUTHOR_ID", `${book.id} يشير إلى authorId غير معروف: ${book.authorId}`);
      }
    }
    const ids = authors.map((author) => author.id);
    for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) {
      fail("DUP_AUTHOR_ID", `معرّف مؤلف مكرر في library-authors.json: ${id}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    warnings.push("لم يُعثر على src/data/library-authors.json — تخطّي فحص المؤلفين.");
  }

  try {
    const redirects = JSON.parse(await readFile(REDIRECTS_PATH, "utf8"));
    for (const rule of redirects) {
      const fromId = String(rule.from).replace("/library/", "");
      const toId = String(rule.to).replace("/library/", "");
      if (seenIds.has(fromId)) {
        fail("REDIRECT_LIVE_SOURCE", `تحويل من ${rule.from} لكن المعرّف ما زال في الفهرس.`);
      }
      if (!seenIds.has(toId)) {
        fail("REDIRECT_DEAD_TARGET", `تحويل إلى ${rule.to} لكن المعرّف غير موجود في الفهرس.`);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    warnings.push("لم يُعثر على scripts/redirects.books.json — تخطّي فحص التحويلات.");
  }

  /* التقرير --------------------------------------------------------- */
  console.log(`فهرس المكتبة: ${books.length} كتابًا.`);
  for (const warning of warnings) console.log(`تحذير: ${warning}`);

  if (failures.length) {
    console.error(`\nفشل فحص السلامة (${failures.length} خطأ):`);
    for (const failure of failures) console.error(`   ${failure}`);
    process.exit(1);
  }

  console.log("نجح فحص سلامة فهرس المكتبة.");
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectRun) await main();
