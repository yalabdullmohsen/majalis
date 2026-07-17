#!/usr/bin/env node
/**
 * توليد بيان صفحات المصحف (ترقيم مدينة، 604 صفحة) — المرحلة 8.
 *
 * لا يقرأ ولا يُعدِّل نص أي آية إطلاقًا — يقرأ فقط حقل "page" الموجود
 * أصلاً في كل آية داخل public/data/quran/surah-*.json (جزء من بيانات
 * AlQuran Cloud الأصلية المحفوظة حرفيًا، ومطابق فعليًا لترقيم مجمع الملك
 * فهد المعياري — تحقّقتُ يدويًا: سورة البقرة صفحات 2-49، سورة الناس
 * (الأخيرة) صفحة 604) ويبني منه فهرسًا مرجعيًا: كل صفحة ← أي سور/نطاقات
 * آيات تقع فيها. الفهرس لا يحتوي نص أي آية — إشارات (أرقام) فقط، فلا خطر
 * على النص المحمي، ومصدر الحقيقة الوحيد يبقى ملفات السور نفسها.
 *
 * تشغيل: node scripts/generate-quran-pages-manifest.mjs
 * (يُعاد توليده تلقائيًا لو تغيّرت ملفات السور المحلية — راجع أيضًا
 * scripts/verify-quran-pages-manifest.mjs الذي يتحقق من اكتماله وصحته.)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");

const EXPECTED_TOTAL_PAGES = 604;
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

async function main() {
  console.log(`${BOLD}توليد بيان صفحات المصحف (604 صفحة)${RESET}\n`);

  const manifestRaw = await readFile(path.join(DATA_DIR, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  /** @type {Map<number, Array<{surah:number, from:number, to:number}>>} */
  const byPage = new Map();
  let totalAyahsSeen = 0;

  for (const entry of manifest.surahs) {
    const content = JSON.parse(await readFile(path.join(DATA_DIR, entry.file), "utf8"));
    let rangeStart = null;
    let rangePage = null;
    let prevAyah = null;

    const flush = (endAyah) => {
      if (rangePage == null || rangeStart == null) return;
      const list = byPage.get(rangePage) ?? [];
      list.push({ surah: entry.number, from: rangeStart, to: endAyah });
      byPage.set(rangePage, list);
    };

    for (const ayah of content.ayahs) {
      totalAyahsSeen++;
      if (rangePage === null) {
        rangePage = ayah.page;
        rangeStart = ayah.numberInSurah;
      } else if (ayah.page !== rangePage) {
        flush(prevAyah.numberInSurah);
        rangePage = ayah.page;
        rangeStart = ayah.numberInSurah;
      }
      prevAyah = ayah;
    }
    flush(prevAyah.numberInSurah);
  }

  const pages = [];
  for (let p = 1; p <= EXPECTED_TOTAL_PAGES; p++) {
    const ranges = byPage.get(p);
    if (!ranges) {
      console.log(`${RED}✗ الصفحة ${p} بلا أي آيات — توقّف${RESET}`);
      process.exit(1);
    }
    pages.push({ page: p, ranges });
  }

  const extraPages = [...byPage.keys()].filter((p) => p < 1 || p > EXPECTED_TOTAL_PAGES);
  if (extraPages.length) {
    console.log(`${RED}✗ أرقام صفحات خارج النطاق 1-604: ${extraPages.join(", ")}${RESET}`);
    process.exit(1);
  }

  const output = {
    $comment: "مُولَّد آليًا من public/data/quran/surah-*.json عبر scripts/generate-quran-pages-manifest.mjs — لا تحرّره يدويًا. لا يحتوي نص أي آية، إشارات (سورة/نطاق رقم آية) فقط.",
    generatedAt: new Date().toISOString().slice(0, 10),
    totalPages: EXPECTED_TOTAL_PAGES,
    pages,
  };

  await writeFile(path.join(DATA_DIR, "pages-manifest.json"), JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`${GREEN}✓ ${EXPECTED_TOTAL_PAGES} صفحة، ${totalAyahsSeen} آية مفحوصة${RESET}`);
  console.log(`${GREEN}✓ كُتب public/data/quran/pages-manifest.json${RESET}`);
}

main().catch((err) => {
  console.error(`${RED}خطأ:${RESET}`, err);
  process.exit(1);
});
