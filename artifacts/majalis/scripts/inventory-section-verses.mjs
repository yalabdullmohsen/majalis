/**
 * جرد اقتباسات الأقسام (ROUTE_QUOTE) والتحقق من الآيات مقابل
 * public/data/quran/surah-XXX.json — المصدر المحلي المعتمد (لا شبكة).
 *
 * ممنوع: إعادة كتابة النص، تطبيع يغيّر الرسم، اقتراح آية بديلة.
 * تشغيل: node --import tsx scripts/inventory-section-verses.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTE_QUOTE } from "../src/config/section-template.ts";
import { getSectionByRoute } from "../src/config/sections.registry.ts";

const __dir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dir, "..");
const repoRoot = resolve(appRoot, "../..");
const quranDir = join(appRoot, "public/data/quran");
const outDir = join(repoRoot, "docs/content-quality");
const inventoryJson = join(outDir, "section-verse-inventory.json");
const reviewMd = join(outDir, "SECTION_VERSE_REVIEW.md");

/** أسماء السور القصيرة — نفس ترتيب Hafs في quran-api (لا اختراع) */
const SURAH_NAMES_AR = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

/** تهجئات واردة في refs فقط — ربط لأسماء القائمة أعلاه (لا نص قرآني) */
const SURAH_ALIASES = {
  "فصّلت": "فصلت",
  "فُصِّلَت": "فصلت",
  "الإسراء": "الإسراء",
  "بنى إسرائيل": "الإسراء",
};

const ARABIC_DIGITS = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function toAsciiDigits(s) {
  return s.replace(/[٠-٩]/g, (d) => ARABIC_DIGITS[d] ?? d);
}

function parseAyahRef(ref) {
  const cleaned = toAsciiDigits(String(ref).trim());
  const m = cleaned.match(/^(.+?)\s*[:：]\s*(\d+)\s*$/);
  if (!m) return null;
  let name = m[1].trim();
  name = SURAH_ALIASES[name] ?? name;
  const idx = SURAH_NAMES_AR.indexOf(name);
  if (idx < 0) return { error: `unknown_surah:${name}`, surahName: name, ayahNumber: Number(m[2]) };
  return { surahNumber: idx + 1, surahName: SURAH_NAMES_AR[idx], ayahNumber: Number(m[2]) };
}

function loadSourceAyah(surahNumber, ayahNumber) {
  const file = join(quranDir, `surah-${String(surahNumber).padStart(3, "0")}.json`);
  if (!existsSync(file)) return { error: `missing_file:${file}` };
  const data = JSON.parse(readFileSync(file, "utf8"));
  const ayah = (data.ayahs ?? []).find((a) => a.numberInSurah === ayahNumber);
  if (!ayah) return { error: `ayah_not_found:${surahNumber}:${ayahNumber}`, sourceFile: file };
  return {
    sourceFile: file,
    sourceKey: `${surahNumber}:${ayahNumber}`,
    sourceText: ayah.text,
    sourceSha256: createHash("sha256").update(ayah.text, "utf8").digest("hex"),
  };
}

function compareTexts(displayed, sourceText) {
  if (displayed === sourceText) {
    return { textIntegrityStatus: "EXACT_MATCH", note: "تطابق بايت-لبايت مع المصدر المحلي" };
  }
  if (sourceText.includes(displayed)) {
    return {
      textIntegrityStatus: "PARTIAL_SUBSTRING_OF_SOURCE",
      note: "النص المعروض جزء من الآية في المصدر دون تطبيع — ليس تطابقًا كاملًا؛ يُعامل كـ TEXT_MISMATCH للعقود الصارمة",
    };
  }
  return {
    textIntegrityStatus: "TEXT_MISMATCH",
    note: "اختلاف عن المصدر المحلي (رسم/تشكيل/اقتطاع). RELEASE_BLOCKER_CRITICAL — لا تصحيح آلي",
  };
}

/**
 * توصيات ملاءمة — قرارات منتج/هيكل فقط.
 * لا اقتراح آية بديلة. NEEDS_SCHOLAR_REVIEW عند الشك.
 */
function relevanceFor(route, sectionId) {
  if (route === "/quiz") {
    return {
      relevanceStatus: "IRRELEVANT_TO_SECTION",
      recommendedAction: "REMOVE",
      finalDecision: "REMOVE",
      rationale: "قرار المنتج: صفحة مسابقة أسئلة — احذف بطاقة الآية بالكامل بلا استبدال.",
    };
  }
  // أقسام قرآنية مباشرة — الإبقاء مشروط بتطابق النص لاحقًا
  const keepCandidates = new Set([
    "/tafsir", "/quran-hub/tajweed", "/quran-hub/qiraat", "/ulum-quran",
    "/quran/surah-stories", "/adhkar", "/duas", "/tawhid", "/arabic-language",
    "/prophets", "/seerah", "/miracles",
  ]);
  if (keepCandidates.has(route)) {
    return {
      relevanceStatus: "NEEDS_SCHOLAR_REVIEW",
      recommendedAction: "KEEP_IF_TEXT_VERIFIED_ELSE_BLOCK",
      finalDecision: "NEEDS_SCHOLAR_REVIEW",
      rationale: "ارتباط موضوعي محتمل؛ الاعتماد النهائي للمراجع مع اشتراط تطابق المصدر.",
    };
  }
  // خدمات/دليل — غالبًا زخرفي
  const unnecessary = new Set([
    "/islamic-directory", "/universities", "/institutions", "/islamic-landmarks",
    "/library", "/academic-research", "/islamic-glossary",
  ]);
  if (unnecessary.has(route)) {
    return {
      relevanceStatus: "VERIFIED_BUT_UNNECESSARY",
      recommendedAction: "REMOVE",
      finalDecision: "REMOVE",
      rationale: "آية في واجهة خدمية/دليل — تخفيف الواجهة أولى؛ بلا استبدال.",
    };
  }
  return {
    relevanceStatus: "NEEDS_SCHOLAR_REVIEW",
    recommendedAction: "NEEDS_SCHOLAR_REVIEW",
    finalDecision: "NEEDS_SCHOLAR_REVIEW",
    rationale: "يتطلب مراجعة ملاءمة متخصصة؛ لا حذف/إبقاء نهائي في PR-1.",
  };
}

function inventoryRouteQuotes() {
  const rows = [];
  for (const [route, quote] of Object.entries(ROUTE_QUOTE)) {
    const sec = getSectionByRoute(route);
    const base = {
      route,
      sectionId: quote.sectionId,
      registrySectionId: sec?.id ?? null,
      sectionIdMatch: sec ? sec.id === quote.sectionId : null,
      component: "ROUTE_QUOTE → SectionTemplatePage/SectionHero",
      sourceFile: "artifacts/majalis/src/config/section-template.ts",
      displayedText: quote.text,
      ref: quote.ref,
      type: quote.type ?? "unknown",
      currentPurpose: "section_intro_quote",
    };

    if (quote.type !== "ayah") {
      rows.push({
        ...base,
        surahNumber: null,
        ayahNumber: null,
        sourceKey: null,
        textIntegrityStatus: "N/A_NOT_AYAH",
        referenceStatus: "N/A_HADITH_OR_OTHER",
        displayStatus: "ACTIVE",
        relevanceStatus: "N/A_NOT_AYAH",
        recommendedAction: "DEFER_HADITH_REVIEW",
        finalDecision: "KEEP",
        reviewerType: "hadith_specialist",
        notes: "اقتباس حديث/غير قرآني — خارج تحقق نص المصحف في هذه الموجة.",
      });
      continue;
    }

    const parsed = parseAyahRef(quote.ref);
    const rel = relevanceFor(route, quote.sectionId);

    if (!parsed || parsed.error) {
      rows.push({
        ...base,
        surahNumber: parsed?.surahNumber ?? null,
        ayahNumber: parsed?.ayahNumber ?? null,
        sourceKey: null,
        textIntegrityStatus: "INVALID_REFERENCE",
        referenceStatus: "INVALID_REFERENCE",
        displayStatus: "ACTIVE",
        ...rel,
        recommendedAction: rel.recommendedAction === "REMOVE" ? "REMOVE" : "NEEDS_SCHOLAR_REVIEW",
        finalDecision: rel.finalDecision === "REMOVE" ? "REMOVE" : "NEEDS_SCHOLAR_REVIEW",
        reviewerType: "quran_source",
        notes: parsed?.error ?? "تعذّر تحليل المرجع",
        releaseBlocker: true,
      });
      continue;
    }

    const src = loadSourceAyah(parsed.surahNumber, parsed.ayahNumber);
    if (src.error) {
      rows.push({
        ...base,
        surahNumber: parsed.surahNumber,
        ayahNumber: parsed.ayahNumber,
        sourceKey: `${parsed.surahNumber}:${parsed.ayahNumber}`,
        textIntegrityStatus: "INVALID_REFERENCE",
        referenceStatus: "INVALID_REFERENCE",
        displayStatus: "ACTIVE",
        ...rel,
        reviewerType: "quran_source",
        notes: src.error,
        releaseBlocker: true,
      });
      continue;
    }

    const cmp = compareTexts(quote.text, src.sourceText);
    const integrity =
      cmp.textIntegrityStatus === "EXACT_MATCH"
        ? "VERIFIED_EXACT"
        : "TEXT_MISMATCH";

    rows.push({
      ...base,
      surahNumber: parsed.surahNumber,
      ayahNumber: parsed.ayahNumber,
      surahName: parsed.surahName,
      sourceKey: src.sourceKey,
      sourcePath: src.sourceFile.replace(`${repoRoot}/`, ""),
      sourceSha256: src.sourceSha256,
      sourceTextLength: src.sourceText.length,
      displayedTextLength: quote.text.length,
      textIntegrityStatus: integrity,
      compareDetail: cmp.textIntegrityStatus,
      compareNote: cmp.note,
      referenceStatus: "PARSED_OK",
      displayStatus: "ACTIVE",
      ...rel,
      reviewerType: "quran_source + scholar",
      releaseBlocker: integrity !== "VERIFIED_EXACT",
      notes:
        integrity !== "VERIFIED_EXACT"
          ? "النص في الواجهة نسخة يدوية منفصلة عن المصدر المحلي — يُحظر التصحيح الآلي."
          : "تطابق كامل مع المصدر المحلي.",
    });
  }
  return rows;
}

/** مسارات عامة من السجل بلا ROUTE_QUOTE — نتيجة صريحة */
function routesWithoutQuote() {
  // استيراد ديناميكي ثقيل — نكتفي بقراءة المفاتيح من ROUTE_THEME في الملف عبر regex خفيف
  const tpl = readFileSync(join(appRoot, "src/config/section-template.ts"), "utf8");
  const themeRoutes = [...tpl.matchAll(/"(\/[^"]+)":\s*"/g)]
    .map((m) => m[1])
    .filter((r, i, a) => a.indexOf(r) === i);
  const quoted = new Set(Object.keys(ROUTE_QUOTE));
  return themeRoutes
    .filter((r) => !quoted.has(r))
    .map((route) => ({
      route,
      sectionId: getSectionByRoute(route)?.id ?? null,
      component: "SectionTemplatePage",
      displayedText: null,
      type: null,
      textIntegrityStatus: "NO_QUOTE",
      referenceStatus: "N/A",
      relevanceStatus: "N/A",
      recommendedAction: "NONE",
      finalDecision: "NO_VERSE",
      notes: "لا اقتباس في ROUTE_QUOTE — نتيجة جرد صريحة.",
    }));
}

function renderMarkdown(ayahRows, noQuoteRows, scannedExtra) {
  const blockers = ayahRows.filter((r) => r.releaseBlocker);
  const removes = ayahRows.filter((r) => r.finalDecision === "REMOVE");
  const lines = [];
  lines.push("# SECTION_VERSE_REVIEW — موجة PR-1 (جرد + تحقق مصدر)");
  lines.push("");
  lines.push("> **قاعدة:** لا يُعاد كتابة النص القرآني آليًا ولا من الذاكرة. أي `TEXT_MISMATCH` = `RELEASE_BLOCKER_CRITICAL`.");
  lines.push(">");
  lines.push("> المصدر المعتمد للتحقق: `artifacts/majalis/public/data/quran/surah-XXX.json` (لقطة محلية موثّقة — راجع `artifacts/majalis/docs/quran-data-source.md`).");
  lines.push(">");
  lines.push(`> تاريخ الجرد: ${new Date().toISOString().slice(0, 10)} · السكربت: \`scripts/inventory-section-verses.mjs\``);
  lines.push("");
  lines.push("## ملخص");
  lines.push("");
  lines.push(`| مؤشر | قيمة |`);
  lines.push(`|---|---|`);
  lines.push(`| اقتباسات ROUTE_QUOTE | ${Object.keys(ROUTE_QUOTE).length} |`);
  lines.push(`| منها type=ayah | ${ayahRows.length} |`);
  lines.push(`| type≠ayah (حديث وغيره) | ${Object.values(ROUTE_QUOTE).filter((q) => q.type !== "ayah").length} |`);
  lines.push(`| TEXT_MISMATCH / عدم تطابق كامل | ${blockers.length} |`);
  lines.push(`| توصية REMOVE | ${removes.length} |`);
  lines.push(`| مسارات ثيم بلا اقتباس | ${noQuoteRows.length} |`);
  lines.push("");
  lines.push("## قرارات منتج مؤكدة");
  lines.push("");
  lines.push("- `/quiz` (تحدي الأسئلة / سين جيم): **REMOVE** بطاقة الآية بالكامل — بلا استبدال. مقدمة مباشرة للمسابقة فقط.");
  lines.push("- ممنوع استبدال آية بأخرى في هذه الموجة.");
  lines.push("- PR-2+ للمكوّن الموحّد والحذف التنفيذي بعد دمج هذا التقرير.");
  lines.push("");
  lines.push("## سجل الآيات (ROUTE_QUOTE)");
  lines.push("");
  lines.push("| route | sectionId | surah:ayah | integrity | relevance | decision | blocker |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of ayahRows) {
    const key = r.sourceKey ?? "—";
    lines.push(
      `| \`${r.route}\` | ${r.sectionId} | ${key} | ${r.textIntegrityStatus} | ${r.relevanceStatus} | **${r.finalDecision}** | ${r.releaseBlocker ? "YES" : "no"} |`,
    );
  }
  lines.push("");
  lines.push("## تفاصيل لكل موضع");
  lines.push("");
  for (const r of ayahRows) {
    lines.push(`### \`${r.route}\``);
    lines.push("");
    lines.push(`- **sectionId:** ${r.sectionId} (registry match: ${r.sectionIdMatch})`);
    lines.push(`- **ref:** ${r.ref}`);
    lines.push(`- **sourceKey:** ${r.sourceKey ?? "—"}`);
    lines.push(`- **sourcePath:** ${r.sourcePath ?? "—"}`);
    lines.push(`- **textIntegrityStatus:** ${r.textIntegrityStatus}${r.compareDetail ? ` (${r.compareDetail})` : ""}`);
    lines.push(`- **referenceStatus:** ${r.referenceStatus}`);
    lines.push(`- **relevanceStatus:** ${r.relevanceStatus}`);
    lines.push(`- **recommendedAction / finalDecision:** ${r.recommendedAction} / **${r.finalDecision}**`);
    lines.push(`- **reviewerType:** ${r.reviewerType}`);
    lines.push(`- **notes:** ${r.notes}`);
    if (r.compareNote) lines.push(`- **compare:** ${r.compareNote}`);
    lines.push(`- **displayedText (للمراجعة فقط — لا يُنسخ كمصدر):** طول ${r.displayedTextLength ?? r.displayedText.length} حرفًا`);
    lines.push("");
  }
  lines.push("## مسارات ثيم بلا آية في ROUTE_QUOTE");
  lines.push("");
  for (const r of noQuoteRows) {
    lines.push(`- \`${r.route}\` — ${r.notes}`);
  }
  lines.push("");
  lines.push("## مواضع إضافية مُشار إليها (لم تُفحَص بايت-لبايت في PR-1)");
  lines.push("");
  lines.push("تتطلب موجة لاحقة من الجرد الموسّع:");
  for (const x of scannedExtra) {
    lines.push(`- \`${x}\``);
  }
  lines.push("");
  lines.push("## حالات موحّدة (قاموس)");
  lines.push("");
  lines.push("- `VERIFIED_EXACT` — تطابق بايت-لبايت مع المصدر المحلي");
  lines.push("- `TEXT_MISMATCH` — اختلاف رسم/تشكيل/اقتطاع → RELEASE_BLOCKER_CRITICAL");
  lines.push("- `INVALID_REFERENCE` — مرجع غير قابل للحل");
  lines.push("- `REMOVE` / `KEEP` / `NEEDS_SCHOLAR_REVIEW` / `REPLACE_AFTER_REVIEW` (الأخير محظور بلا اعتماد بشري)");
  lines.push("");
  return lines.join("\n");
}

function main() {
  if (!existsSync(quranDir)) {
    console.error("missing quran data dir", quranDir);
    process.exit(1);
  }
  const allQuoteRows = inventoryRouteQuotes();
  const ayahRows = allQuoteRows.filter((r) => r.type === "ayah");
  const noQuoteRows = routesWithoutQuote();
  const scannedExtra = [
    "src/components/home/HomeSacredOfDay.tsx",
    "src/views/ArkanIslamPage.tsx",
    "src/views/MiraclesPage.tsx",
    "src/pages/account/ui/FawaidView.tsx",
    "src/views/AdabTalabIlmPage.tsx",
    "محتوى daily-verse / ticker (آية اليوم)",
  ];

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceContract: "public/data/quran/surah-XXX.json + manifest sha256",
    policy: "no_ai_rewrite_no_memory_correction",
    routeQuoteTotal: Object.keys(ROUTE_QUOTE).length,
    ayahCount: ayahRows.length,
    mismatchCount: ayahRows.filter((r) => r.textIntegrityStatus === "TEXT_MISMATCH").length,
    exactCount: ayahRows.filter((r) => r.textIntegrityStatus === "VERIFIED_EXACT").length,
    removeCount: ayahRows.filter((r) => r.finalDecision === "REMOVE").length,
    rows: allQuoteRows,
    routesWithoutQuote: noQuoteRows,
    deferredScans: scannedExtra,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(inventoryJson, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  writeFileSync(reviewMd, renderMarkdown(ayahRows, noQuoteRows, scannedExtra), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        inventoryJson: inventoryJson.replace(`${repoRoot}/`, ""),
        reviewMd: reviewMd.replace(`${repoRoot}/`, ""),
        ayahCount: payload.ayahCount,
        exactCount: payload.exactCount,
        mismatchCount: payload.mismatchCount,
        removeCount: payload.removeCount,
        quizDecision: ayahRows.find((r) => r.route === "/quiz")?.finalDecision,
      },
      null,
      2,
    ),
  );
}

main();
