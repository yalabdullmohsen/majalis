#!/usr/bin/env node
/**
 * build-quran-position-index.mjs
 * يبني فهرس مواضع رباعيات كلمات كامل المصحف — يُستخدَم لوضع "التسميع
 * الحر" (القسم 2، الوضع 6): تحديد تلقائي لموضع البدء (سورة + آية) من أول
 * كلمات ينطقها المستخدم، بلا اختيار سورة/نطاق مسبق.
 *
 * لماذا فهرس منفصل عن mutashabihat-index.json رغم استخدام نفس رباعيات
 * الكلمات؟ لأن الغرض مختلف تمامًا: فهرس المتشابهات يحتفظ فقط بأزواج آيات
 * متشابهة فوق عتبة تشابه (لغرض تعليمي)، بينما هذا الفهرس يحتاج **كل**
 * رباعية بمواضعها الدقيقة، بما فيها البسملة.
 *
 * ⚠️ قرار مهم يخالف buildReferenceWords عمدًا: هذا الفهرس **لا يفصل
 * البسملة المدمَجة** في نص الآية 1 (خلافًا لـstripEmbeddedBismillah في
 * quran-reference-words.ts). لماذا؟ لأن غرض هذا الفهرس هو "ماذا قد
 * يقوله المستخدم فعليًا قبل بدء أي سورة" — وقول البسملة قبل أي سورة (لا
 * الفاتحة فقط) عادة شائعة جدًا في التسميع الفعلي. لو استُبعدت البسملة من
 * كل سورة عدا الفاتحة، لكان أي مستخدم يبدأ ببسملة ثم سورة الإخلاص مثلاً
 * سيُكتشَف خطأً كأنه بدأ الفاتحة (البسملة الوحيدة المفهرَسة). البسملة هنا
 * أداة **اكتشاف فقط**؛ لا تُستخدَم إطلاقًا كمرجع تصحيح لاحقًا — الجلسة
 * الفعلية تُبنى دومًا عبر buildReferenceWords العادية (تفصل البسملة كما
 * كانت) بمجرد معرفة السورة/الآية المُكتشَفة.
 *
 * ⚠️ الرباعيات تُحسَب من **تدفّق كلمات متواصل عبر كل آيات السورة** لا
 * داخل كل آية منفردة — ضروري لأن بعض الآيات قصيرة جدًا (مثال: الفاتحة:2
 * "الحمد لله رب العالمين"، 4 كلمات بالضبط) فلا توجد كلمة خامسة "داخل نفس
 * الآية" لحلّ غموض محتمل؛ الكلمة المُحِلَّة للغموض غالبًا تقع في بداية
 * الآية التالية فعليًا.
 *
 * الصيغة: {[رباعية مطبَّعة]: [[surah, ayah, streamIndex], ...]}
 *   - ayah = رقم الآية داخل السورة لأول كلمة من الرباعية — يُستهلَك مباشرة
 *     لبدء الجلسة عبر startSessionForAyahRange(surah, ayah, ...).
 *   - streamIndex = فهرس متواصل عبر كل كلمات السورة (بما فيها البسملة) —
 *     لغرض التحقّق من التتالي في freeform-start-detector.ts فقط (حسم
 *     الغموض عبر رباعيات منزلقة)، لا يُستخدَم خارج هذا الفهرس.
 *
 * تشغيل: npx tsx scripts/build-quran-position-index.mjs
 * المخرَج: public/data/quran/quran-position-index.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeQuranText } from "../src/lib/recitation-ai/quran-normalize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data", "quran");
const OUTPUT_PATH = path.join(DATA_DIR, "quran-position-index.json");

const QUADGRAM_SIZE = 4;

async function loadAllSurahsAsWordStreams() {
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const surahs = [];
  for (const s of manifest.surahs) {
    const data = JSON.parse(await readFile(path.join(DATA_DIR, s.file), "utf8"));
    const stream = []; // [{ ayah, word }, ...] متواصل عبر كل آيات السورة، بلا فصل بسملة (راجع التعليق أعلاه)
    for (const a of data.ayahs) {
      for (const word of normalizeQuranText(a.text)) {
        stream.push({ ayah: a.numberInSurah, word });
      }
    }
    surahs.push({ surah: s.number, stream });
  }
  return surahs;
}

async function main() {
  console.log("قراءة كل آيات المصحف (114 سورة) وتطبيعها كتدفّق متواصل لكل سورة (بلا فصل بسملة)...");
  const surahs = await loadAllSurahsAsWordStreams();
  console.log(`  ${surahs.length} سورة مقروءة (${surahs.reduce((n, s) => n + s.stream.length, 0)} كلمة إجمالًا).`);

  console.log("بناء فهرس مواضع الرباعيات (عابرة لحدود الآيات داخل كل سورة)...");
  const index = new Map(); // quadgram → [[surah, ayah, streamIndex], ...]
  let totalQuadgrams = 0;
  for (const { surah, stream } of surahs) {
    for (let i = 0; i + QUADGRAM_SIZE <= stream.length; i++) {
      const g = stream.slice(i, i + QUADGRAM_SIZE).map((w) => w.word).join(" ");
      if (!index.has(g)) index.set(g, []);
      index.get(g).push([surah, stream[i].ayah, i]);
      totalQuadgrams++;
    }
  }
  console.log(`  ${index.size} رباعيّة فريدة، ${totalQuadgrams} موضعًا إجمالًا.`);

  const uniqueCount = [...index.values()].filter((v) => v.length === 1).length;
  console.log(`  ${uniqueCount} رباعيّة (${Math.round((uniqueCount / index.size) * 100)}%) لها موضع وحيد في كامل المصحف — تحديد فوري بلا غموض.`);

  const output = Object.fromEntries(index);
  await writeFile(OUTPUT_PATH, JSON.stringify(output), "utf8");
  console.log(`✓ كُتب الفهرس → ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error("فشل بناء فهرس المواضع:", err);
  process.exit(1);
});
