/**
 * اختبارات دعامة "المصحف بنظام الصفحات" (نواة المصحف الرقمي — البرومبت 1):
 *  1. deriveHizbRub — اشتقاق الحزب/الربع من hizbQuarter الخام.
 *  2. stripArabicDiacritics — نسخ الآية بلا تشكيل يزيل الحركات فقط
 *     (لا يوحّد الهمزات ولا يحذف الألف الخنجرية — خلافًا لتطبيع المطابقة
 *     في recitation-ai/quran-normalize.ts الذي له غرض مختلف تمامًا).
 *  3. سلامة public/data/quran/page-juz-index.json المُستهلَك في
 *     MushafPageView.tsx: 604 صفحة كاملة، كل مقطع ayahFrom <= ayahTo.
 *
 * تشغيل: npx tsx src/lib/__tests__/mushaf-page-view.test.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveHizbRub, JUZ_START_PAGES } from "../quran-api";
import { stripArabicDiacritics } from "../share-ayah";
import { findPageForAyah } from "../recitation-ai/page-juz-lookup";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ deriveHizbRub — حدود كل حزب (4 أرباع) ═══");
{
  assert(JSON.stringify(deriveHizbRub(1)) === JSON.stringify({ hizb: 1, rubInHizb: 1 }), "الربع 1 ← الحزب 1، الربع 1 داخله");
  assert(JSON.stringify(deriveHizbRub(4)) === JSON.stringify({ hizb: 1, rubInHizb: 4 }), "الربع 4 ← آخر ربع في الحزب 1");
  assert(JSON.stringify(deriveHizbRub(5)) === JSON.stringify({ hizb: 2, rubInHizb: 1 }), "الربع 5 ← أول ربع في الحزب 2");
  assert(JSON.stringify(deriveHizbRub(240)) === JSON.stringify({ hizb: 60, rubInHizb: 4 }), "الربع 240 (الأخير) ← الحزب 60، الربع 4");
}

console.log("═══ stripArabicDiacritics — إزالة الحركات فقط، لا توحيد حروف ═══");
{
  assert(stripArabicDiacritics("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ") === "بسم ٱللَّه ٱلرَّحْمَٰن ٱلرَّحِيم".replace(/[ً-ٰٟ]/g, ""), "الفاتحة:1 بلا تشكيل — يبقى الرسم (ٱ) كما هو، لا تحويل لألف عادية");
  assert(!/[ً-ٰٟ]/.test(stripArabicDiacritics("قُلْ هُوَ ٱللَّهُ أَحَدٌ")), "لا حركات متبقية بعد الإزالة");
  assert(stripArabicDiacritics("بدون اي تشكيل هنا") === "بدون اي تشكيل هنا", "نص بلا تشكيل أصلاً يبقى كما هو دون تغيير حروفه");
  assert(stripArabicDiacritics("﻿بِسْمِ") !== "", "إزالة BOM (U+FEFF) الموجود فعليًا في بعض ملفات public/data/quran لا يُسقط بقية النص");
}

console.log("═══ سلامة page-juz-index.json (المصدر الحقيقي لـMushafPageView) ═══");
{
  const idx = JSON.parse(readFileSync(path.join(ROOT, "public/data/quran/page-juz-index.json"), "utf8"));
  const pages = Object.keys(idx.byPage);
  assert(pages.length === 604, `604 صفحة كاملة في الفهرس (${pages.length})`);
  const allPagesHaveSegments = Array.from({ length: 604 }, (_, i) => i + 1)
    .every((p) => Array.isArray(idx.byPage[String(p)]) && idx.byPage[String(p)].length > 0);
  assert(allPagesHaveSegments, "كل صفحة من 1 إلى 604 لها مقطع واحد على الأقل");
  let allSegmentsValid = true;
  for (const p of pages) {
    for (const seg of idx.byPage[p]) {
      if (!(seg.surah >= 1 && seg.surah <= 114 && seg.ayahFrom >= 1 && seg.ayahFrom <= seg.ayahTo)) allSegmentsValid = false;
    }
  }
  assert(allSegmentsValid, "كل مقاطع كل الصفحات: سورة صالحة (1–114) و ayahFrom <= ayahTo");
}

console.log("═══ JUZ_START_PAGES + findPageForAyah ═══");
{
  assert(JUZ_START_PAGES.length === 30, "30 جزءًا في JUZ_START_PAGES");
  assert(JUZ_START_PAGES[0] === 1 && JUZ_START_PAGES[29] === 582, "حدود الجزء 1 والجزء 30 صحيحة");

  const idx = JSON.parse(readFileSync(path.join(ROOT, "public/data/quran/page-juz-index.json"), "utf8"));
  assert(findPageForAyah(idx, 1, 1) === 1, "الفاتحة:1 ← صفحة 1");
  assert(findPageForAyah(idx, 2, 142) === 22, "البقرة:142 ← صفحة 22 (أول الجزء 2)");
  assert(findPageForAyah(idx, 114, 6) === 604, "الناس:6 ← صفحة 604");
}

console.log("═══ MushafPageView — بلا transform:scale، تمييز mf2، فهرس موسّع ═══");
{
  const viewSrc = readFileSync(path.join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
  assert(!viewSrc.includes("transform: `scale("), "أُزيل تكبير transform:scale من قارئ المصحف");
  assert(viewSrc.includes("--qs-font-scale"), "تكبير الخط عبر متغير CSS قابل للتمرير");
  assert(viewSrc.includes("qs-mushaf-body--hl-"), "نمط التمييز يُمرَّر لحاوية الصفحة");
  assert(viewSrc.includes("quran-shell--ayah"), "قارئ المصحف بنمط آية");
  assert(viewSrc.includes("mpv-ayah-page-badge"), "شارة رقم الصفحة (خرطوش)");
  assert(viewSrc.includes("mpv-ayah-page-badge__cartouche"), "خرطوش SVG لرقم الصفحة");
  assert(viewSrc.includes("onSelectPage"), "فهرس المصحف يدعم الانتقال لصفحة/إشارة");

  const listSrc = readFileSync(path.join(ROOT, "src/components/quran/SurahList.tsx"), "utf8");
  assert(listSrc.includes('"juz"') && listSrc.includes('"bookmarks"'), "فهرس يتضمن تبويبي الأجزاء والإشارات");

  const swSrc = readFileSync(path.join(ROOT, "public/sw.js"), "utf8");
  assert(swSrc.includes("/data/quran-v2/"), "Service Worker يخزّن بيانات quran-v2");
}

console.log(`\n${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
