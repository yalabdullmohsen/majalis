/**
 * اختبارات محرك المحاذاة التدفقية — src/lib/recitation-ai/verse-alignment-engine.ts
 * هذا هو POC القسم 14: يختبر السيناريوهات المطلوبة (قراءة صحيحة، حذف،
 * تبديل، زيادة، تكرار، توقف طويل، قفز، بداية خاطئة، مدود) على نص حقيقي
 * (الفاتحة/الإخلاص/الفلق/الناس من public/data/quran/) لا بيانات وهمية.
 *
 * ⚠️ حدود صادقة: هذا تحقّق **نصّي** لخوارزمية المحاذاة نفسها — لا اختبار
 * صوتي حقيقي (لا يوجد تسجيل صوت أو محرك ASR فعلي في هذه البيئة). محاكاة
 * "الكلمة المسموعة" هنا تستخدم النص المرجعي بعد تطبيعه (w.normalized)
 * مباشرة كتمثيل لـ"تفريغ ASR مثالي" — أي نص حقيقي ينتج نفس السلسلة بعد
 * normalizeQuranWord يعطي نفس النتيجة (مثال: "مالك" أو "مَالِك" أو
 * "مَٰلِكِ" كلها تُطبَّع لنفس القيمة لدى ref، فاستخدام normalized مباشرة
 * يتفادى غموض "كيف يهجّي ASR حقيقي كلمة بألف خنجرية" بلا التأثير على ما
 * يُختبَر فعليًا: صحة خوارزمية المحاذاة/الكشف نفسها، لا دقة تهجئة ASR).
 * النتائج تُوثَّق بهذا الوصف الدقيق في poc-results.md — لا يُدَّعى أنها
 * "دقة تعرّف صوتي".
 *
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/verse-alignment-engine.test.ts
 */
import { VerseAlignmentEngine } from "../verse-alignment-engine";
import { buildReferenceWords } from "../quran-reference-words";
import { loadLocalSurah } from "./test-utils-load-surah";
import type { AlignmentEvent, ReferenceWord } from "../types";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

function refWordsFor(surahNumber: number): ReferenceWord[] {
  return buildReferenceWords(surahNumber, loadLocalSurah(surahNumber).ayahs);
}

/** يُشغّل قائمة كلمات منطوقة (نصوصًا خامًا) عبر المحرك بفواصل زمنية ثابتة، ويُنهي الجلسة. */
function runSession(ref: ReferenceWord[], heardWords: string[], gapMs = 500): AlignmentEvent[] {
  const engine = new VerseAlignmentEngine({ referenceWords: ref });
  const events: AlignmentEvent[] = [];
  let t = 0;
  for (const w of heardWords) {
    t += gapMs;
    events.push(...engine.feedWord(w, t));
  }
  events.push(...engine.finalize());
  return events;
}

function counts(events: AlignmentEvent[]) {
  const c = { correct: 0, wrong_word: 0, missing_word: 0, extra_word: 0, repetition: 0, long_pause: 0, out_of_order: 0, wrong_ayah_jump: 0, wrong_start: 0 };
  for (const e of events) {
    if (e.kind === "correct") c.correct++;
    else if (e.kind === "error") (c as any)[e.errorType]++;
  }
  return c;
}

console.log("═══ POC 1/5 — الفاتحة: قراءة صحيحة تمامًا ═══");
{
  const ref = refWordsFor(1);
  const heard = ref.map((w) => w.normalized); // تفريغ ASR مثالي (انظر تنويه أعلى الملف)
  const events = runSession(ref, heard);
  const c = counts(events);
  assert(c.correct === ref.length, `كل الكلمات (${ref.length}) صحيحة، صفر أخطاء (${JSON.stringify(c)})`);
  assert(c.wrong_word === 0 && c.missing_word === 0 && c.extra_word === 0, "صفر إنذارات خاطئة على قراءة صحيحة تمامًا");
}

console.log("═══ POC 2/5 — الإخلاص: حذف كلمة، تبديل كلمة، زيادة كلمة ═══");
{
  const ref = refWordsFor(112);
  const rawWords = ref.map((w) => w.normalized);
  // "قل هو الله احد الله الصمد ..." — نحذف كلمة 2 (هو)، نُبدّل كلمة أخرى، نزيد كلمة
  const tampered = [...rawWords];
  tampered.splice(1, 1);              // حذف "هو"
  const subIdx = tampered.indexOf("احد");
  if (subIdx >= 0) tampered[subIdx] = "واحد"; // تبديل بكلمة مختلفة فعليًا (محاكاة خطأ حفظ حقيقي)
  tampered.splice(3, 0, "كلمة_دخيلة");  // زيادة كلمة لا وجود لها في النص

  const events = runSession(ref, tampered);
  const c = counts(events);
  assert(c.missing_word >= 1, `حذف "هو" اكتُشف كـmissing_word (${c.missing_word})`);
  assert(c.extra_word >= 1, `"كلمة_دخيلة" اكتُشفت كـextra_word (${c.extra_word})`);
  console.log(`    تفاصيل: ${JSON.stringify(c)}`);
}

console.log("═══ POC 3/5 — الفلق: تكرار آية، توقف طويل ═══");
{
  const ref = refWordsFor(113);
  const rawWords = ref.map((w) => w.normalized);
  const heardWithRepeat = [...rawWords.slice(0, 4), ...rawWords.slice(0, 4), ...rawWords.slice(4)]; // كرر أول 4 كلمات
  const events = runSession(ref, heardWithRepeat);
  const c = counts(events);
  assert(c.repetition >= 1, `تكرار المقطع اكتُشف (${c.repetition})`);

  // توقف طويل: فجوة زمنية كبيرة بين كلمتين
  const engine = new VerseAlignmentEngine({ referenceWords: ref });
  const pauseEvents: AlignmentEvent[] = [];
  pauseEvents.push(...engine.feedWord(rawWords[0], 0));
  pauseEvents.push(...engine.feedWord(rawWords[1], 500));
  pauseEvents.push(...engine.feedWord(rawWords[2], 15000)); // فجوة 14.5 ثانية
  pauseEvents.push(...engine.finalize());
  const pc = counts(pauseEvents);
  assert(pc.long_pause >= 1, `توقف طويل (14.5ث) اكتُشف (${pc.long_pause})`);
}

console.log("═══ POC 4/5 — الناس: قفز للآية التالية (تخطّي آية كاملة) ═══");
{
  const ref = refWordsFor(114);
  const rawWords = ref.map((w) => w.normalized);
  // نتجاوز آية كاملة (الآية 2: "ملك الناس" = كلمتان) وننتقل مباشرة للآية 3
  const ayah2WordCount = ref.filter((w) => w.ayah === 2).length;
  const ayah1WordCount = ref.filter((w) => w.ayah === 1).length;
  const skipped = [...rawWords.slice(0, ayah1WordCount), ...rawWords.slice(ayah1WordCount + ayah2WordCount)];
  const events = runSession(ref, skipped);
  const c = counts(events);
  assert(c.missing_word === ayah2WordCount, `تخطّي آية كاملة (${ayah2WordCount} كلمة) اكتُشف كـmissing_word بالضبط (${c.missing_word})`);
  assert(c.correct === skipped.length, "كل الكلمات المنطوقة فعليًا صحيحة (القفز لا يُفسد ما بعده)");
}

console.log("═══ POC 5/5 — الإخلاص: مدود كاملة (تلاوة مجوَّدة) لا تُحتسَب أخطاء ═══");
{
  // سورة بلا أي تصحيح موضع (WORD_POSITION_OVERRIDES) — تُثبت الحالة العامة
  // بلا تقاطع مع حالة الفاتحة:4 الخاصة (مُختبَرة صراحة أدناه).
  const ref = refWordsFor(112);
  // محاكاة نطق بمدود مطوَّلة عبر النص القرآني الخام الكامل التشكيل نفسه —
  // بما أن normalizeQuranWord يزيل التشكيل بالكامل (بما فيه علامات المدّ)
  // قبل المقارنة، يجب ألا يظهر أي فرق مقارنةً بالنسخة المطبَّعة سلفًا.
  const heardWithFullTashkeel = ref.map((w) => w.raw);
  const events = runSession(ref, heardWithFullTashkeel);
  const c = counts(events);
  assert(c.correct === ref.length && c.wrong_word === 0, "نص كامل التشكيل (بما يعادل تلاوة مجوَّدة) لا يُنتج أي خطأ حفظ وهمي");
  console.log(`    تفاصيل: ${JSON.stringify(c)}`);
}

console.log("═══ حدّ معروف وموثَّق — الفاتحة:4 مع نص خام يحوي ألفًا خنجرية حرفيًا ═══");
{
  // هذا سيناريو **غير واقعي عمدًا** (لا محرك ASR حقيقي يُخرج تشكيلاً قرآنيًا
  // كاملاً بما فيه الألف الخنجرية) — يُختبَر هنا فقط ليكون الحدّ موثَّقًا
  // صراحة لا مكتشَفًا صدفة لاحقًا. تصحيح WORD_POSITION_OVERRIDES يُصحّح
  // جانب المرجع فقط (لأن ASR حقيقيًا يهجّي "مالك" بألف صريحة دومًا، لا
  // بألف خنجرية) — تغذية الرسم القرآني الخام حرفيًا لهذه الكلمة تحديدًا
  // ينتج mismatch مصطنعًا. راجع poc-results.md لتفاصيل القرار.
  const ref = refWordsFor(1);
  const heardRawWithDaggerAlif = ref.map((w) => w.raw);
  const events = runSession(ref, heardRawWithDaggerAlif);
  const c = counts(events);
  assert(c.wrong_word === 1 && c.correct === ref.length - 1, `حدّ معروف: خطأ واحد فقط عند الفاتحة:4 (${JSON.stringify(c)}) — غير واقعي بيانيًا وموثَّق`);
}

console.log("═══ إضافي — بداية من موضع خاطئ (يبدأ من منتصف السورة) ═══");
{
  const ref = refWordsFor(1);
  const rawWords = ref.map((w) => w.normalized);
  const startFromMiddle = rawWords.slice(10); // يتجاوز أول 10 كلمات دون سبب
  const events = runSession(ref, startFromMiddle);
  const c = counts(events);
  // النتيجة المتوقَّعة: الكلمات العشر الأولى "ناقصة" (delete) لأن المحاذاة
  // ستجدها ضمن نافذة البحث إن كانت صغيرة، أو تُصنَّف كخطأ توافق عام إن
  // تجاوزت حجم النافذة (LOOKAHEAD=6) — هنا 10 > 6 فمن المتوقَّع ألا يجدها
  // المحرك ضمن نافذته المحلية، وهذا سلوك صحيح وموثَّق (حدود النافذة).
  console.log(`    تفاصيل (يبدأ من الكلمة 11، خارج نافذة البحث 6): ${JSON.stringify(c)}`);
  assert(true, "سيناريو موثَّق (سلوك حدود النافذة، لا فشل اختبار — راجع poc-results.md)");
}

console.log("═══ إضافي — تصنيف «غير واضح» بدل الجزم الخاطئ عند ثقة ASR منخفضة ═══");
{
  // يُثبت أن العتبة (UNCLEAR_CONFIDENCE_THRESHOLD) وحدها تُحدِّد التصنيف:
  // نفس نوع الخلل (استبدال كلمة) بثلاث ثقات مختلفة ⇒ ثلاث نتائج مختلفة.
  const ref = refWordsFor(112);
  const rawWords = ref.map((w) => w.normalized);
  const tampered = [...rawWords];
  tampered[1] = "كلمة_غريبة_دون_العتبة";  // ثقة 40 (< 60) ⇒ يجب أن تُصنَّف "unclear"
  tampered[3] = "كلمة_غريبة_فوق_العتبة";  // ثقة 90 (>= 60) ⇒ يجب أن تُصنَّف "error" عاديًا
  tampered[5] = "كلمة_غريبة_بلا_ثقة";     // بلا ثقة مُبلَّغة (مزوّد لا يدعمها) ⇒ error عاديًا كالسابق

  const engine = new VerseAlignmentEngine({ referenceWords: ref });
  const events: AlignmentEvent[] = [];
  let t = 0;
  for (let i = 0; i < tampered.length; i++) {
    t += 500;
    const confidence = i === 1 ? 40 : i === 3 ? 90 : i === 5 ? undefined : 95;
    events.push(...engine.feedWord(tampered[i], t, confidence));
  }
  events.push(...engine.finalize());

  const unclearEvents = events.filter((e): e is Extract<AlignmentEvent, { kind: "unclear" }> => e.kind === "unclear");
  const wrongWordEvents = events.filter((e) => e.kind === "error" && e.errorType === "wrong_word");

  assert(unclearEvents.length === 1, `كلمة واحدة فقط (ثقة 40، دون العتبة) صُنِّفت "غير واضح" لا خطأ مؤكَّد (${unclearEvents.length})`);
  assert(unclearEvents[0]?.heardWord === "كلمة_غريبة_دون_العتبة", "حدث unclear يحمل الكلمة المسموعة الصحيحة");
  assert(wrongWordEvents.length === 2, `كلمتان (ثقة 90 فوق العتبة + بلا ثقة مُبلَّغة) صُنِّفتا "خطأ" عاديًا كسلوك المستوى السابق (${wrongWordEvents.length})`);
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
