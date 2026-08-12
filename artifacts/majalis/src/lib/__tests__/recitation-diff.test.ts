/**
 * اختبارات src/lib/recitation-diff.ts — يثبت أن النظام القديم ("اختبر
 * تلاوتك" في RecitationTestPanel.tsx) يستخدم الآن نفس جودة التطبيع
 * والمحاذاة المستخدَمة في محرك التسميع الكامل، بعد إصلاح الازدواجية
 * الموثَّق في TASMEE_AUDIT.md.
 *
 * تشغيل: npx tsx src/lib/__tests__/recitation-diff.test.ts
 */
import { diffRecitation } from "../recitation-diff";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ مطابقة تامة ═══");
{
  const r = diffRecitation("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "بسم الله الرحمن الرحيم");
  assert(r.matchPercent === 100, `مطابقة تامة ← 100% (${r.matchPercent}%)`);
  assert(r.words.every((w) => w.matched), "كل الكلمات مُطابَقة");
}

console.log("═══ إصلاح ازدواجية التطبيع — «رب العالمين» ═══");
{
  // "العالمين" رسمًا حديثًا (ألف صريحة) يجب أن تُطابق "ٱلْعَٰلَمِينَ"
  // القرآنية (ألف خنجرية) — هذا بالضبط الخلل المُصلَح في quran-normalize.ts
  // اليوم، والآن يستفيد منه هذا الملف أيضًا بعد إزالة الازدواجية.
  const r = diffRecitation("رَبِّ ٱلْعَٰلَمِينَ", "رب العالمين");
  assert(r.matchPercent === 100, `"رب العالمين" (رسم حديث) ← 100% مطابقة لا خطأ وهمي (${r.matchPercent}%، ${JSON.stringify(r.words)})`);
}

console.log("═══ مرادف رسم عثماني — الصلوة/الصلاة ═══");
{
  const r = diffRecitation("وَأَقِيمُوا۟ ٱلصَّلَوٰةَ", "واقيموا الصلاة");
  assert(r.matchPercent === 100, `"الصلوة" (عثماني) = "الصلاة" (حديث) ← 100% (${r.matchPercent}%)`);
}

console.log("═══ استبدال كلمة حقيقي (خطأ حفظ) يبقى مكتشَفًا ═══");
{
  const r = diffRecitation("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "قل هو الله واحد");
  const lastWord = r.words[r.words.length - 1];
  assert(!lastWord.matched, `استبدال "أحد" بـ"واحد" ← يبقى خطأ حفظ حقيقي مكتشَفًا (لا يُخفيه إصلاح التطبيع) (${JSON.stringify(r.words)})`);
}

console.log("═══ حالات حدّية ═══");
{
  const empty = diffRecitation("", "شيء");
  assert(empty.matchPercent === 0 && empty.words.length === 0, "نص مرجعي فارغ ← نتيجة فارغة آمنة");
  const noSpeech = diffRecitation("بِسْمِ ٱللَّهِ", "");
  assert(noSpeech.matchPercent === 0 && noSpeech.words.every((w) => !w.matched), "لا كلام منطوق ← كل الكلمات غير مطابَقة، بلا استثناء");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
