#!/usr/bin/env node
/**
 * build-mutashabihat-index.mjs
 * يبني فهرسًا حقيقيًا (محسوبًا لا يدويًا) لآيات المصحف "المتشابهة" —
 * القسم 1 من مواصفة "التلاوة واختبار التسميع" (بند تفوّق: "كشف
 * المتشابهات مقارنةً بترتيل"، القسم 9).
 *
 * الفكرة: المتشابهات (سبب شائع لخلط الحفّاظ) هي آيات تتشارك مقطعًا نصيًا
 * طويلًا نسبيًا (4 كلمات متتالية فأكثر بعد التطبيع) رغم اختلاف موضعها في
 * المصحف — مثال معروف: تكرار "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ"
 * 31 مرة في سورة الرحمن، أو تشابه مطالع قصص الأنبياء بين عدة سور.
 *
 * المنهجية (بلا أي قائمة يدوية مُعدَّة سلفًا — كل شيء محسوب من نص
 * public/data/quran/*.json الموثوق فعليًا):
 *   1. تطبيع كل آية (نفس normalizeQuranWord المستخدَمة في محرك المحاذاة
 *      نفسه — ضمان اتساق تام بين الفهرس والمقارنة الحيّة وقت التسميع).
 *   2. استخراج كل "رباعيّة كلمات" متتالية (quadgram) من كل آية (آيات
 *      أقصر من 4 كلمات تُستبعَد من الفهرسة — راجع التعليق أدناه).
 *   3. آيتان تتشاركان رباعيّة واحدة على الأقل ⇒ زوج مرشَّح؛ يُحتسَب
 *      overlapRatio = (عدد الرباعيات المشترَكة) / (أقل عدد رباعيات بين
 *      الآيتين) — عتبة 0.5 فأعلى فقط تُعتبَر "متشابهة" فعليًا (تفادي
 *      تطابقات عرضية لعبارات قرآنية شائعة قصيرة).
 *   4. لكل آية: أعلى 5 آيات تشابهًا فقط تُحفَظ (لا فهرس متضخم بلا فائدة
 *      تعليمية) بعد استبعاد الآية نفسها.
 *
 * ⚠️ حدّ صادق وموثَّق: آيات أقصر من 4 كلمات (بعد التطبيع) لا تُفهرَس على
 * الإطلاق (لا رباعيات ممكنة) — هذا يستبعد بعض الآيات القصيرة جدًا (نادرة)
 * من الكشف؛ قرار واعٍ يفضّل عدم الفهرسة على مطابقات كلمة واحدة عشوائية لا
 * قيمة تعليمية حقيقية فيها.
 *
 * تشغيل: npx tsx scripts/build-mutashabihat-index.mjs
 * المخرَج: public/data/quran/mutashabihat-index.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeQuranText } from "../src/lib/recitation-ai/quran-normalize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");
const OUTPUT_PATH = path.join(DATA_DIR, "mutashabihat-index.json");

const QUADGRAM_SIZE = 4;
const MIN_OVERLAP_RATIO = 0.5;
const MAX_MATCHES_PER_AYAH = 5;

// البسملة "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" تتصدَّر ayah 1 في بيانات
// معظم السور (113 من 114) — تشابهها الحرفي بين كل سورة وأخرى **متوقَّع
// هيكليًا** لا "خلطًا" حقيقيًا محتمل الحدوث أثناء التسميع (السياق يُزيل
// اللبس تمامًا: لا حافظ يخلط بين بسملتي سورتين). استبعادها من الفهرسة هنا
// يمنعها من إغراق أعلى 5 تشابهات لكل آية تبدأ بها بمطابقات بلا قيمة
// تعليمية، فتُفسِح المجال لتشابهات نصية حقيقية أكثر فائدة.
const BISMILLAH_NORMALIZED = normalizeQuranText("بسم الله الرحمن الرحيم").join(" ");

async function loadAllAyahs() {
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const ayahs = [];
  for (const s of manifest.surahs) {
    const data = JSON.parse(await readFile(path.join(DATA_DIR, s.file), "utf8"));
    for (const a of data.ayahs) {
      const words = normalizeQuranText(a.text);
      ayahs.push({ surah: s.number, ayah: a.numberInSurah, words });
    }
  }
  return ayahs;
}

function quadgramsOf(words) {
  const grams = [];
  for (let i = 0; i + QUADGRAM_SIZE <= words.length; i++) {
    grams.push(words.slice(i, i + QUADGRAM_SIZE).join(" "));
  }
  return grams;
}

async function main() {
  console.log("قراءة كل آيات المصحف (114 سورة) وتطبيعها...");
  const ayahs = await loadAllAyahs();
  console.log(`  ${ayahs.length} آية مقروءة.`);

  const quadgramIndex = new Map(); // quadgram → [ayahIdx, ...]
  const ayahQuadgrams = ayahs.map((a) => quadgramsOf(a.words));

  for (let i = 0; i < ayahs.length; i++) {
    for (const g of ayahQuadgrams[i]) {
      if (g === BISMILLAH_NORMALIZED) continue; // راجع تعليق BISMILLAH_NORMALIZED أعلاه
      if (!quadgramIndex.has(g)) quadgramIndex.set(g, []);
      quadgramIndex.get(g).push(i);
    }
  }

  const indexableCount = ayahQuadgrams.filter((g) => g.length > 0).length;
  console.log(`  ${indexableCount} آية قابلة للفهرسة (>=4 كلمات بعد التطبيع)، ${quadgramIndex.size} رباعيّة فريدة.`);

  console.log("حساب أزواج التشابه المرشَّحة...");
  const sharedCount = new Map(); // "i,j" (i<j) → عدد الرباعيات المشترَكة
  for (const positions of quadgramIndex.values()) {
    if (positions.length < 2) continue;
    for (let a = 0; a < positions.length; a++) {
      for (let b = a + 1; b < positions.length; b++) {
        const i = Math.min(positions[a], positions[b]);
        const j = Math.max(positions[a], positions[b]);
        const key = `${i},${j}`;
        sharedCount.set(key, (sharedCount.get(key) ?? 0) + 1);
      }
    }
  }
  console.log(`  ${sharedCount.size} زوج مرشَّح (يتشارك رباعيّة واحدة على الأقل).`);

  console.log(`تصفية الأزواج بعتبة overlapRatio >= ${MIN_OVERLAP_RATIO}...`);
  const matchesByAyah = new Map(); // ayahIdx → [{idx, overlapRatio, shared}]
  for (const [key, shared] of sharedCount) {
    const [i, j] = key.split(",").map(Number);
    const minGrams = Math.min(ayahQuadgrams[i].length, ayahQuadgrams[j].length);
    if (minGrams === 0) continue;
    const overlapRatio = shared / minGrams;
    if (overlapRatio < MIN_OVERLAP_RATIO) continue;
    if (!matchesByAyah.has(i)) matchesByAyah.set(i, []);
    if (!matchesByAyah.has(j)) matchesByAyah.set(j, []);
    matchesByAyah.get(i).push({ idx: j, overlapRatio, shared });
    matchesByAyah.get(j).push({ idx: i, overlapRatio, shared });
  }

  const output = {};
  let totalPairsKept = 0;
  for (const [idx, matches] of matchesByAyah) {
    matches.sort((a, b) => b.overlapRatio - a.overlapRatio || b.shared - a.shared);
    const top = matches.slice(0, MAX_MATCHES_PER_AYAH);
    const from = ayahs[idx];
    const key = `${from.surah}:${from.ayah}`;
    output[key] = top.map((m) => ({
      surah: ayahs[m.idx].surah,
      ayah: ayahs[m.idx].ayah,
      overlapRatio: Math.round(m.overlapRatio * 100) / 100,
    }));
    totalPairsKept += top.length;
  }

  console.log(`  ${Object.keys(output).length} آية لها متشابهات (${totalPairsKept} زوجًا محفوظًا إجمالًا، ≤${MAX_MATCHES_PER_AYAH} لكل آية).`);

  await writeFile(OUTPUT_PATH, JSON.stringify(output), "utf8");
  console.log(`✓ كُتب الفهرس → ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("فشل بناء فهرس المتشابهات:", err);
  process.exit(1);
});
