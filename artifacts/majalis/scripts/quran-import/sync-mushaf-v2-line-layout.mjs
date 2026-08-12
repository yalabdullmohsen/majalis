#!/usr/bin/env node
/**
 * sync-mushaf-v2-line-layout.mjs
 *
 * يزامن `line_number` و`position` فقط من تخطيط QCF V2 الصحيح.
 *
 * المعرّفات (موثَّقة قبل التنفيذ):
 *   - خطوط العرض: `quran.com/fonts/quran/hafs/v2/woff2/p{n}.woff2` → QCF V2
 *   - معرّف المصحف المطابق: mushaf=1 على api.qurancdn.com
 *   - الجلب التاريخي الخاطئ استخدم mushaf=2 (تخطيط QCF V1) مع خطوط V2.
 *
 * لا يمسّ: code_v2 / text_* / verse_key / أرقام السور والآيات / أي حقل آخر.
 *
 * الصفحات التي تختلف فيها تجزئة الكلمات/حدود الصفحة عن mushaf=1 تُتخطّى
 * (لا يمكن مزامنة الأسطر دون تغيير النص) وتُوثَّق في التقرير.
 *
 * تشغيل: node scripts/quran-import/sync-mushaf-v2-line-layout.mjs
 * تحقق فقط: node scripts/quran-import/sync-mushaf-v2-line-layout.mjs --check
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");
const PAGES_DIR = path.join(APP_ROOT, "public/data/quran-v2/pages");
const REPORT_PATH = path.join(APP_ROOT, ".local/mushaf/sync-line-layout-report.json");

/** QCF V2 / hafs/v2 — يجب أن يطابق خطوط public/fonts/qpc-v2. يُمنع أي mushaf≠1. */
export const MUSHAF_ID_QCF_V2 = 1;
if (MUSHAF_ID_QCF_V2 !== 1) {
  throw new Error("مرفوض: يُمنع مزامنة الأسطر من mushaf≠1 — راجع public/data/quran-v2/SOURCE.json");
}
const API = "https://api.qurancdn.com/api/qdc/verses/by_page";
const TOTAL = 604;
const CONCURRENCY = 6;
const RETRY = 4;

/** صفحات المصحف المدني التي ينتهي محتواها قبل السطر 15 (من mushaf=1) */
const KNOWN_MAX_LINE_LT_15 = new Set([
  1, 2, // الفاتحة وأول البقرة
  76, 207, 331, 341, 349, 366, 376, 414, 417, 445, 452, 498, 506, 525, 548, 555, 557, 584,
]);

const checkOnly = process.argv.includes("--check");

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < RETRY) {
      await new Promise((r) => setTimeout(r, 600 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw err;
  }
}

function pagePath(n) {
  return path.join(PAGES_DIR, `page-${String(n).padStart(3, "0")}.json`);
}

function asVerses(raw) {
  return Array.isArray(raw) ? raw : (raw?.verses ?? []);
}

function fingerprint(verses) {
  const codes = [];
  let words = 0;
  const verseKeys = [];
  for (const v of verses) {
    verseKeys.push(v.verse_key);
    for (const w of v.words ?? []) {
      words++;
      codes.push(w.code_v2 ?? "");
    }
  }
  return {
    codesJoined: codes.join(""),
    wordCount: words,
    verseKeys: verseKeys.join("|"),
    verseCount: verses.length,
  };
}

function collectLineStats(verses) {
  const byLine = new Map();
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const ln = w.line_number;
      if (!byLine.has(ln)) byLine.set(ln, []);
      byLine.get(ln).push(w);
    }
  }
  return byLine;
}

/**
 * @param {{ requireFullFifteen?: boolean }} opts
 * requireFullFifteen: للصفحات المزامَنة من mushaf=1 فقط (مع استثناءات معروفة).
 */
function validatePage(pageNum, verses, beforeFp, opts = {}) {
  const { requireFullFifteen = true } = opts;
  const issues = [];
  const afterFp = fingerprint(verses);
  if (afterFp.codesJoined !== beforeFp.codesJoined) {
    issues.push(`تجزئة code_v2 تغيّرت`);
  }
  if (afterFp.wordCount !== beforeFp.wordCount) {
    issues.push(`عدد الكلمات ${afterFp.wordCount} != ${beforeFp.wordCount}`);
  }
  if (afterFp.verseKeys !== beforeFp.verseKeys) {
    issues.push(`ترتيب/مفاتيح الآيات تغيّرت`);
  }

  const byLine = collectLineStats(verses);
  if (byLine.size === 0) {
    issues.push(`لا أسطر`);
    return issues;
  }

  for (const [ln, words] of byLine) {
    if (typeof ln !== "number" || !Number.isInteger(ln)) {
      issues.push(`سطر غير رقمي: ${ln}`);
      continue;
    }
    if (ln < 1 || ln > 15) issues.push(`سطر خارج النطاق 1–15: ${ln}`);
    if (words.length === 0) issues.push(`سطر فارغ: ${ln}`);
  }
  for (const v of verses) {
    let prevLine = 0;
    let expectedPos = 1;
    for (const w of v.words ?? []) {
      if (w.line_number == null) issues.push(`كلمة بلا سطر id=${w.id}`);
      if (typeof w.line_number === "number" && w.line_number < prevLine) {
        issues.push(`آية ${v.verse_key}: line_number تنازلي ${prevLine}→${w.line_number}`);
      }
      if (typeof w.line_number === "number") prevLine = w.line_number;
      if (w.position !== expectedPos) {
        issues.push(`آية ${v.verse_key}: position=${w.position} متوقع ${expectedPos}`);
      }
      expectedPos++;
    }
  }

  // فجوات الأسطر مسموحة: سطر ترويسة السورة لا يحتوي كلمات في JSON.
  const maxLn = Math.max(...byLine.keys());
  if (
    requireFullFifteen &&
    pageNum >= 3 &&
    maxLn !== 15 &&
    !KNOWN_MAX_LINE_LT_15.has(pageNum)
  ) {
    issues.push(`أقصى سطر=${maxLn} متوقع 15 (صفحة ${pageNum})`);
  }

  return issues;
}

async function fetchApiLayout(pageNumber) {
  const url =
    `${API}/${pageNumber}?words=true` +
    `&word_fields=code_v2,line_number,position,char_type_name` +
    `&mushaf=${MUSHAF_ID_QCF_V2}&per_page=50`;
  const data = await fetchJson(url);
  const verses = data.verses ?? [];
  const map = new Map(); // verse_key:position -> {line, position, code}
  const codes = [];
  for (const v of verses) {
    for (const w of v.words ?? []) {
      const key = `${v.verse_key}:${w.position}`;
      map.set(key, {
        line: w.line_number,
        position: w.position,
        code: w.code_v2,
      });
      codes.push(w.code_v2 ?? "");
    }
  }
  return { verses, map, wordCount: map.size, codesJoined: codes.join("") };
}

function applyLayout(localVerses, apiMap) {
  let changed = 0;
  const clone = structuredClone(localVerses);
  for (const v of clone) {
    for (const w of v.words ?? []) {
      const key = `${v.verse_key}:${w.position}`;
      const api = apiMap.get(key);
      if (!api) {
        throw new Error(`لا مطابقة API لـ ${key}`);
      }
      if (api.code !== w.code_v2) {
        throw new Error(
          `اختلاف code_v2 عند ${key} (محلي=${w.code_v2} api=${api.code})`,
        );
      }
      if (w.line_number !== api.line || w.position !== api.position) {
        w.line_number = api.line;
        w.position = api.position;
        changed++;
      }
    }
  }
  return { verses: clone, changed };
}

async function preparePage(pageNum) {
  const file = pagePath(pageNum);
  const localVerses = asVerses(JSON.parse(await readFile(file, "utf8")));
  const beforeFp = fingerprint(localVerses);
  const api = await fetchApiLayout(pageNum);

  if (api.codesJoined !== beforeFp.codesJoined || api.wordCount !== beforeFp.wordCount) {
    // لا يمكن المزامنة دون تغيير النص/التجزئة — تحقق بنيوي مرن فقط
    const structuralIssues = validatePage(pageNum, localVerses, beforeFp, {
      requireFullFifteen: false,
    });
    return {
      pageNum,
      status: "skipped_segmentation_mismatch",
      changed: 0,
      wordCount: beforeFp.wordCount,
      apiWordCount: api.wordCount,
      structuralIssues,
      verses: null,
    };
  }

  const { verses, changed } = applyLayout(localVerses, api.map);
  const issues = validatePage(pageNum, verses, beforeFp, { requireFullFifteen: true });
  if (issues.length) {
    return {
      pageNum,
      status: "validation_failed",
      changed,
      wordCount: beforeFp.wordCount,
      issues,
      verses: null,
    };
  }

  return {
    pageNum,
    status: changed > 0 ? "updated" : "unchanged",
    changed,
    wordCount: beforeFp.wordCount,
    verses,
  };
}

async function main() {
  console.log(`مصحف المزامنة: mushaf=${MUSHAF_ID_QCF_V2} (QCF V2 / hafs/v2)`);
  console.log(checkOnly ? "وضع التحقق فقط — بلا كتابة" : "مزامنة مرحلتان: تحقق الكل ثم كتابة");

  const files = (await readdir(PAGES_DIR)).filter((f) => f.endsWith(".json"));
  if (files.length !== TOTAL) {
    throw new Error(`عدد ملفات الصفحات ${files.length} != ${TOTAL}`);
  }

  const pages = Array.from({ length: TOTAL }, (_, i) => i + 1);
  const prepared = [];
  let done = 0;

  async function worker(chunk) {
    for (const p of chunk) {
      prepared.push(await preparePage(p));
      done++;
      if (done % 50 === 0 || done === TOTAL) {
        console.log(`  تحضير ${done}/${TOTAL}...`);
      }
    }
  }

  const chunks = Array.from({ length: CONCURRENCY }, (_, i) =>
    pages.filter((_, idx) => idx % CONCURRENCY === i),
  );
  await Promise.all(chunks.map(worker));
  prepared.sort((a, b) => a.pageNum - b.pageNum);

  const failed = prepared.filter((r) => r.status === "validation_failed");
  const skipped = prepared.filter((r) => r.status === "skipped_segmentation_mismatch");
  const structuralBad = skipped.filter((r) => (r.structuralIssues?.length ?? 0) > 0);
  const toWrite = prepared.filter((r) => r.status === "updated" && r.verses);

  if (failed.length || structuralBad.length) {
    console.error("❌ فشل التحقق الإلزامي — لا كتابة:");
    for (const f of failed.slice(0, 15)) {
      console.error(`  صفحة ${f.pageNum}: ${(f.issues ?? []).join("; ")}`);
    }
    for (const f of structuralBad.slice(0, 15)) {
      console.error(`  صفحة ${f.pageNum} (متخطّاة): ${(f.structuralIssues ?? []).join("; ")}`);
    }
    process.exit(1);
  }

  // البوابات على كل الصفحات بعد التطبيق (المتخطّاة تبقى كما هي)
  for (const r of prepared) {
    if (r.status === "skipped_segmentation_mismatch") continue;
    // updated/unchanged already validated
  }

  if (!checkOnly) {
    for (const r of toWrite) {
      await writeFile(pagePath(r.pageNum), JSON.stringify(r.verses, null, 0) + "\n");
    }
  }

  const totalChanged = prepared.reduce((s, r) => s + r.changed, 0);
  const report = {
    mushafId: MUSHAF_ID_QCF_V2,
    fontSource: "quran.com/fonts/quran/hafs/v2/woff2",
    checkedAt: new Date().toISOString(),
    checkOnly,
    totals: {
      pages: TOTAL,
      updated: prepared.filter((r) => r.status === "updated").length,
      unchanged: prepared.filter((r) => r.status === "unchanged").length,
      skippedSegmentationMismatch: skipped.length,
      wordsLineOrPositionChanged: totalChanged,
    },
    skippedPages: skipped.map((r) => ({
      page: r.pageNum,
      localWords: r.wordCount,
      apiWords: r.apiWordCount,
    })),
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`✓ بوابة التحقق نجحت`);
  console.log(`  محدَّث: ${report.totals.updated} | دون تغيير: ${report.totals.unchanged}`);
  console.log(`  متخطّى (اختلاف تجزئة عن mushaf=1): ${skipped.length}`);
  console.log(`  كلمات عُدّل line/position: ${totalChanged}`);
  console.log(`  تقرير: ${REPORT_PATH}`);
  if (skipped.length) {
    console.log(`  صفحات متخطّاة: ${skipped.map((s) => s.pageNum).join(", ")}`);
  }
  if (checkOnly) {
    console.log("(لم تُكتب ملفات — --check)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
