/**
 * اختبارات src/lib/recitation-ai/freeform-start-detector.ts — منطق حسم
 * الغموض نفسه (بيانات اصطناعية محكومة) + تحقّق على بيانات المصحف الحقيقية
 * الفعلية المبنية فعلًا (public/data/quran/quran-position-index.json)
 * لإثبات أن الحسم يعمل على نص قرآني حقيقي لا افتراضي فقط.
 *
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/freeform-start-detector.test.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FreeformStartDetector, MAX_WORDS_BEFORE_GIVEUP, type PositionIndexRaw } from "../freeform-start-detector";
import { normalizeQuranWord } from "../quran-normalize";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ بيانات اصطناعية محكومة ═══");
{
  // رباعية فريدة تمامًا ⇒ حسم فوري من أول 4 كلمات
  const uniqueIndex: PositionIndexRaw = {
    "أ ب ج د": [[10, 3, 2]],
  };
  const d1 = new FreeformStartDetector(uniqueIndex);
  assert(d1.feedWord("أ") === null, "كلمة واحدة فقط ← لم يُحسَم بعد");
  assert(d1.feedWord("ب") === null, "كلمتان ← لم يُحسَم بعد");
  assert(d1.feedWord("ج") === null, "ثلاث كلمات ← لم يُحسَم بعد");
  const r1 = d1.feedWord("د");
  assert(r1 !== null && r1.length === 1 && r1[0].surah === 10 && r1[0].ayah === 3, "رباعية فريدة ← حسم فوري بالموضع الصحيح");

  // رباعية بمرشَّحين ⇒ تُحسَم بكلمة خامسة تُبقي مرشَّحًا واحدًا فقط
  // (streamIndex يتقدَّم +1 لكل كلمة تالية — المرشَّح الأول فقط يستمر صالحًا)
  const ambiguousIndex: PositionIndexRaw = {
    "س م ح ت": [[1, 1, 0], [2, 4, 5]],
    "م ح ت ك": [[1, 1, 1]],   // يُطابق المرشَّح الأول فقط (streamIndex+1=1 موجود لسورة1)
  };
  const d2 = new FreeformStartDetector(ambiguousIndex);
  d2.feedWord("س"); d2.feedWord("م"); d2.feedWord("ح");
  const mid = d2.feedWord("ت");
  assert(mid === null, "أول 4 كلمات بمرشَّحين ⇒ لم يُحسَم بعد (candidates.length=2)");
  const resolved = d2.feedWord("ك");
  assert(resolved !== null && resolved.length === 1 && resolved[0].surah === 1 && resolved[0].ayah === 1, "الكلمة الخامسة تُبقي مرشَّحًا واحدًا فقط ← حسم صحيح");

  // غموض لا يُحسَم أبدًا ⇒ استسلام عند MAX_WORDS_BEFORE_GIVEUP
  // (فهرس حيث كل رباعية متتالية تُعطي دومًا مرشَّحين لا يتقاطعان أبدًا)
  const words = ["و", "ن", "س", "ص", "ب", "ط", "ه", "ي", "ك", "ل", "م"];
  const stuckIndex: PositionIndexRaw = {};
  for (let i = 0; i + 4 <= words.length; i++) {
    const g = words.slice(i, i + 4).join(" ");
    stuckIndex[g] = [[1, 1, i], [2, 2, i + 100]]; // مرشَّحان يبقيان منفصلَين دومًا (لا تقاطع ممكن)
  }
  const d3 = new FreeformStartDetector(stuckIndex);
  let lastResult: ReturnType<typeof d3.feedWord> = null;
  for (const w of words) lastResult = d3.feedWord(w);
  assert(words.length >= MAX_WORDS_BEFORE_GIVEUP, "طول كلمات الاختبار يكفي لبلوغ سقف الاستسلام");
  assert(Array.isArray(lastResult) && lastResult.length === 0, `غموض دائم ← استسلام بمصفوفة فارغة بعد ${MAX_WORDS_BEFORE_GIVEUP} كلمات (${JSON.stringify(lastResult)})`);
}

console.log("═══ تحقّق على فهرس المواضع الحقيقي المبنِيّ فعليًا (كامل المصحف) ═══");
{
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const indexPath = path.resolve(__dirname, "../../../../public/data/quran/quran-position-index.json");
  const realIndex: PositionIndexRaw = JSON.parse(readFileSync(indexPath, "utf8"));
  console.log(`  فهرس حقيقي مُحمَّل: ${Object.keys(realIndex).length} رباعيّة فريدة.`);

  // "الحمد لله رب العالمين" (فاتحة:2 بالضبط، 4 كلمات) — **ليست فريدة**
  // فعليًا (نفس العبارة تُختتَم بها آيات أخرى: يونس:10، الزمر:75، غافر:65
  // — هذا بالضبط اكتشاف فهرس المتشابهات في القسم السابق). لا حسم فوري من
  // 4 كلمات فقط؛ الكلمة الخامسة (بداية الآية 3 التالية "الرحمن") تُحسم
  // الغموض لصالح الفاتحة تحديدًا لأنها الوحيدة التي تتبعها هذه الكلمة هنا.
  const dReal1 = new FreeformStartDetector(realIndex);
  dReal1.feedWord(normalizeQuranWord("الحمد"));
  dReal1.feedWord(normalizeQuranWord("لله"));
  dReal1.feedWord(normalizeQuranWord("رب"));
  const after4 = dReal1.feedWord(normalizeQuranWord("العالمين"));
  assert(after4 === null, `"الحمد لله رب العالمين" وحدها ← غامضة فعليًا (تتكرر في يونس/الزمر/غافر) — لا حسم فوري (${JSON.stringify(after4)})`);
  const rFinal = dReal1.feedWord(normalizeQuranWord("الرحمن"));
  assert(rFinal !== null && rFinal.length === 1 && rFinal[0].surah === 1 && rFinal[0].ayah === 2, `+"الرحمن" (بداية الفاتحة:3) ← حسم صحيح لموضع الفاتحة:2 تحديدًا (${JSON.stringify(rFinal)})`);

  // البسملة وحدها غامضة جدًا فعليًا (114 موضعًا — كل سورة عدا التوبة، زائد
  // تكرارها الفريد داخل النمل:30 "وإنه بسم الله الرحمن الرحيم") — لا حسم
  // فوري ولا حتى بعد "قل" وحدها (تشترك فيها الكافرون/الإخلاص/الفلق/الناس)؛
  // "قل هو" تحديدًا (لا غيرها) تُحسم لصالح الإخلاص فقط (تحقَّق حيًّا قبل
  // كتابة هذا الاختبار — راجع commit).
  const dReal2 = new FreeformStartDetector(realIndex);
  dReal2.feedWord(normalizeQuranWord("بسم"));
  dReal2.feedWord(normalizeQuranWord("الله"));
  dReal2.feedWord(normalizeQuranWord("الرحمن"));
  const afterBismillah = dReal2.feedWord(normalizeQuranWord("الرحيم"));
  assert(afterBismillah === null, "البسملة وحدها (4 كلمات) غامضة جدًا فعليًا (114 موضعًا) — لا حسم فوري (صادق، لا تخمين)");
  dReal2.feedWord(normalizeQuranWord("قل"));
  const afterQul = dReal2.feedWord(normalizeQuranWord("هو"));
  assert(afterQul !== null && afterQul.length === 1 && afterQul[0].surah === 112 && afterQul[0].ayah === 1, `البسملة + "قل هو" ← حسم صحيح لبداية الإخلاص فعليًا (${JSON.stringify(afterQul)})`);
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
