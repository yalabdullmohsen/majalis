#!/usr/bin/env node
/**
 * build-page-juz-index.mjs
 * يبني فهرسًا لمقاطع السور المُكوِّنة لكل صفحة (1-604)، جزء (1-30)، حزب
 * (1-60)، وربع حزب (1-240) من مصحف المدينة، اعتمادًا **حصرًا على حقول
 * `page`/`juz`/`hizbQuarter` الموجودة فعلاً** في بيانات كل آية
 * (public/data/quran/*.json، مصدرها Tanzil عبر AlQuran Cloud — راجع
 * manifest.json). لا تخطيط بصري مُصنَّع ولا إحداثيات كلمات — هذا الفهرس
 * دقيق على مستوى "أي آيات تقع في هذه الصفحة/الجزء/الحزب/الربع" فقط (نفس
 * دقة `numberInSurah` نفسها)، لا أكثر.
 *
 * الحزب (1-60) غير موجود كحقل مستقل في البيانات — يُشتَق حسابيًا من
 * hizbQuarter (1-240، أربعة أرباع لكل حزب): hizb = ceil(hizbQuarter/4).
 * تحقُّق مباشر من البيانات أثبت هذا (240 = 60×4 بالضبط، لا قيمة خارج
 * النطاق) — ليس افتراضًا نظريًا فقط.
 *
 * ⚠️ حدّ صادق موروث من طبيعة البيانات نفسها: كل هذه الحقول مُلحَقة بكل
 * **آية كاملة** (لا بكل كلمة) — آية تمتد فعليًا عبر حدَّين (نادر لكن
 * وارد) تُنسَب بالكامل لجهة واحدة فقط في هذه البيانات. هذا متوافق تمامًا
 * مع بقية البنية القائمة أصلاً (`ReferenceWord` نفسه دقته على مستوى الآية
 * لأغراض أخرى كثيرة، كـ"استكمل من آخر جلسة") — لا يُدخِل قيدًا جديدًا.
 *
 * الصيغة: { byPage: {...}, byJuz: {...}, byHizb: {...}, byRub: {...} }
 * كل مفتاح → [{surah,ayahFrom,ayahTo}, ...] (قد يمتد لأكثر من سورة عند
 * الحدود — نادر لكن وارد ومُتحقَّق منه).
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
  console.log("قراءة كل آيات المصحف (114 سورة) لاستخراج حقول page/juz/hizbQuarter...");
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const entries = [];
  for (const s of manifest.surahs) {
    const data = JSON.parse(await readFile(path.join(DATA_DIR, s.file), "utf8"));
    for (const a of data.ayahs) {
      entries.push({
        surah: s.number,
        ayah: a.numberInSurah,
        page: a.page,
        juz: a.juz,
        rub: a.hizbQuarter,
        hizb: Math.ceil(a.hizbQuarter / 4),
      });
    }
  }
  console.log(`  ${entries.length} آية مقروءة.`);

  const byPage = buildSegments(entries, "page");
  const byJuz = buildSegments(entries, "juz");
  const byHizb = buildSegments(entries, "hizb");
  const byRub = buildSegments(entries, "rub");

  console.log(`  ${Object.keys(byPage).length} صفحة، ${Object.keys(byJuz).length} جزء، ${Object.keys(byHizb).length} حزب، ${Object.keys(byRub).length} ربع حزب.`);
  for (const [label, idx] of [["صفحة", byPage], ["جزء", byJuz], ["حزب", byHizb], ["ربع", byRub]]) {
    const multi = Object.values(idx).filter((segs) => segs.length > 1).length;
    console.log(`  ${multi} ${label} تمتد لأكثر من سورة (متوقَّع وطبيعي عند حدود السور).`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify({ byPage, byJuz, byHizb, byRub }), "utf8");
  console.log(`✓ كُتب الفهرس → ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("فشل بناء فهرس الصفحات/الأجزاء:", err);
  process.exit(1);
});
