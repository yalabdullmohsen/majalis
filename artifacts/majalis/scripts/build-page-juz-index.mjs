#!/usr/bin/env node
/**
 * build-page-juz-index.mjs
 * يبني فهرسًا لمقاطع السور المُكوِّنة لكل صفحة (1-604) وكل جزء (1-30) من
 * مصحف المدينة، اعتمادًا **حصرًا على حقلَي `page`/`juz` الموجودَين فعلاً**
 * في بيانات كل آية (public/data/quran/*.json، مصدرها Tanzil عبر
 * AlQuran Cloud — راجع manifest.json). لا تخطيط بصري مُصنَّع ولا إحداثيات
 * كلمات — هذا الفهرس دقيق على مستوى "أي آيات تقع في هذه الصفحة/الجزء"
 * فقط (نفس دقة `numberInSurah` نفسها)، لا أكثر.
 *
 * ⚠️ حدّ صادق موروث من طبيعة البيانات نفسها: حقل `page` مُلحَق بكل **آية
 * كاملة** (لا بكل كلمة) — آية تمتد فعليًا عبر صفحتين مطبوعتين (نادر لكن
 * وارد) تُنسَب بالكامل لصفحة واحدة فقط في هذه البيانات. هذا متوافق تمامًا
 * مع بقية البنية القائمة أصلاً (`ReferenceWord` نفسه دقته على مستوى الآية
 * لأغراض أخرى كثيرة، كـ"استكمل من آخر جلسة") — لا يُدخِل قيدًا جديدًا.
 *
 * الصيغة: { byPage: { [page]: [{surah,ayahFrom,ayahTo}, ...] },
 *           byJuz:  { [juz]:  [{surah,ayahFrom,ayahTo}, ...] } }
 * كل صفحة/جزء قد تمتد لأكثر من سورة (نادر) أو مقطع غير متصل داخل نفس
 * السورة (غير وارد عمليًا لأن ترقيم الصفحات/الأجزاء يتبع ترتيب الآيات
 * تصاعديًا دومًا) — لذا مصفوفة المقاطع لكل مفتاح غالبًا عنصر واحد فقط.
 *
 * تشغيل: npx tsx scripts/build-page-juz-index.mjs
 * المخرَج: public/data/quran/page-juz-index.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");
const OUTPUT_PATH = path.join(DATA_DIR, "page-juz-index.json");

/** يجمع تسلسل (surah, ayah) حسب مفتاح (page أو juz)، مُنتِجًا مقاطع متصلة لكل سورة داخل كل مفتاح. */
function buildSegments(entries, keyField) {
  const byKey = new Map(); // key → surah → {min,max}
  for (const { surah, ayah, [keyField]: key } of entries) {
    if (!byKey.has(key)) byKey.set(key, new Map());
    const bySurah = byKey.get(key);
    if (!bySurah.has(surah)) bySurah.set(surah, { min: ayah, max: ayah });
    else {
      const r = bySurah.get(surah);
      r.min = Math.min(r.min, ayah);
      r.max = Math.max(r.max, ayah);
    }
  }
  const result = {};
  for (const [key, bySurah] of byKey) {
    result[key] = [...bySurah.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([surah, r]) => ({ surah, ayahFrom: r.min, ayahTo: r.max }));
  }
  return result;
}

async function main() {
  console.log("قراءة كل آيات المصحف (114 سورة) لاستخراج حقلَي page/juz...");
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const entries = [];
  for (const s of manifest.surahs) {
    const data = JSON.parse(await readFile(path.join(DATA_DIR, s.file), "utf8"));
    for (const a of data.ayahs) {
      entries.push({ surah: s.number, ayah: a.numberInSurah, page: a.page, juz: a.juz });
    }
  }
  console.log(`  ${entries.length} آية مقروءة.`);

  const byPage = buildSegments(entries, "page");
  const byJuz = buildSegments(entries, "juz");

  console.log(`  ${Object.keys(byPage).length} صفحة، ${Object.keys(byJuz).length} جزء.`);
  const multiSurahPages = Object.values(byPage).filter((segs) => segs.length > 1).length;
  const multiSurahJuz = Object.values(byJuz).filter((segs) => segs.length > 1).length;
  console.log(`  ${multiSurahPages} صفحة تمتد لأكثر من سورة، ${multiSurahJuz} جزء يمتد لأكثر من سورة (متوقَّع وطبيعي عند حدود السور).`);

  await writeFile(OUTPUT_PATH, JSON.stringify({ byPage, byJuz }), "utf8");
  console.log(`✓ كُتب الفهرس → ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("فشل بناء فهرس الصفحات/الأجزاء:", err);
  process.exit(1);
});
