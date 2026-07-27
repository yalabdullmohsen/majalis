/**
 * اختبارات وحدة — سلامة الفوائد المختارة (`fawaid-curated-seed.ts`)
 *
 * الملفُّ يُعرَض للزائر في `/fawaid` مدموجًا مع `fawaid-seed.ts`، ونصُّ كلِّ
 * فائدةٍ يُطبع كما هو. وقد كُشف في ج-٢٨٤ أنَّ ذيلَ الوعظِ الثابتَ الذي تُختم
 * به الفائدةُ («— فليُلزم المسلم العمل بما علم…») أصابه ثلاثةُ أعطابٍ صامتة
 * لا يمسكها فحصُ الأنواعِ ولا البناء، ويقرؤها الزائرُ في الصفحة:
 *
 *   ١. **ذيلٌ مكرَّرٌ مرّتين** في السجلِّ الواحد (٣٢ سجلًّا) — فيقرأ الزائرُ
 *      الوصيةَ نفسَها مرَّتين متتاليتين.
 *   ٢. **ذيلٌ مبتورٌ في وسطِ الكلمة**: «— فليُلزم المسلم العمل بما.» و«…والدعوة.»
 *      (٦ سجلّات) — جملةٌ مقطوعةٌ بلا خبر.
 *   ٣. **شظيّةٌ معلَّقةٌ** «والدعوة إليه.» تُلحَق بجملةٍ تامّةٍ سبق أن انتهت
 *      (٨ سجلّات) — أسوؤها ما جاء بعد «فليس بحديث مرفوع.» فصار كلامًا بلا مُسنَدٍ إليه.
 *
 * وفحصٌ رابعٌ يحرسُ اتساقَ التخريج: لا يُنسَب النصُّ في `source` إلى أحد
 * الشيخين ثمَّ يُنسَب في `author_name` إلى الآخر (تناقضٌ داخليٌّ يُوهم الزائر).
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/fawaid-curated-integrity.test.ts
 */

import { readFileSync } from "node:fs";
import { FAWAID_CURATED_SEED, FAWAID_CURATED_CATEGORIES } from "../fawaid-curated-seed";
import { SEED_FAWAID } from "../fawaid-seed";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    if (detail) console.error(`         ${detail}`);
    failed++;
  }
}

console.log(`\nسلامة الفوائد المختارة — ${FAWAID_CURATED_SEED.length} فائدة\n`);

/**
 * صيغةُ ذيلِ الوعظِ الثابت بكلِّ تشكيلاتِها التامّةِ والمبتورة.
 *
 * والشرطةُ المطوَّلةُ **اختياريّة** عمدًا: أوّلُ صياغةٍ لهذا الفحصِ اشترطتها،
 * فأفلتت منه ثلاثةُ سجلّاتٍ ذيلُها الأوّلُ مسبوقٌ بنقطةٍ لا بشرطة — ولم
 * تنكشف إلّا بمقابلةِ حزمةِ البناءِ نفسِها بعد نجاحِ الفحص. فالدرسُ مثبَّتٌ
 * هنا: **يُقاس المعنى لا العلامةُ التي تسبقه.**
 */
const TAIL = /(?:—\s*)?فليُلزم المسلم العمل بما(?:\s+علم(?:\s+والدعوة(?:\s+إليه)?)?)?\s*\./g;

// ─────────────── ١) لا ذيلَ وعظٍ مكرَّرًا في السجل الواحد ───────────────

const doubledTail = FAWAID_CURATED_SEED.filter(
  (f) => (f.text.match(TAIL) ?? []).length > 1
);
assert(
  doubledTail.length === 0,
  "لا سجلَّ يحمل ذيلَ الوعظِ مرّتين (ولو خلا أحدُهما من الشرطة الفاصلة)",
  doubledTail.map((f) => f.id).join(", ")
);

// والملفُّ الشقيقُ يُدمَج معه في الصفحةِ نفسِها فيُحرَس بالفحصِ نفسِه
const doubledTailSeed = SEED_FAWAID.filter((f) => (f.text.match(TAIL) ?? []).length > 1);
assert(
  doubledTailSeed.length === 0,
  "لا سجلَّ في `fawaid-seed.ts` يحمل ذيلَ الوعظِ مرّتين",
  `${doubledTailSeed.length} سجلًّا`
);

// ─────────────── ٢) لا ذيلَ وعظٍ مبتورًا في وسط الكلمة ───────────────

/** الصيغتان التامّتان المعتمدتان وحدَهما (والشرطةُ اختياريّةٌ كما في `TAIL`) */
const COMPLETE_TAIL = /(?:—\s*)?فليُلزم المسلم العمل بما علم(?:\s+والدعوة\s+إليه)?\s*\./;

const truncatedTail = FAWAID_CURATED_SEED.filter((f) => {
  const hits = f.text.match(TAIL) ?? [];
  return hits.some((h) => !COMPLETE_TAIL.test(h));
});
assert(
  truncatedTail.length === 0,
  "لا ذيلَ وعظٍ مبتورًا («…العمل بما.» أو «…والدعوة.»)",
  truncatedTail.map((f) => `${f.id}: …${f.text.slice(-40)}`).join(" | ")
);

// ─────────────── ٣) لا شظيّةَ «والدعوة إليه.» معلَّقةً بعد جملةٍ تامّة ───────────────

const danglingFragment = FAWAID_CURATED_SEED.filter(
  (f) => /\.\s*والدعوة إليه\.\s*$/.test(f.text) && !/بما علم والدعوة إليه\.\s*$/.test(f.text)
);
assert(
  danglingFragment.length === 0,
  "لا شظيّةَ «والدعوة إليه.» معلَّقةً بلا مُسنَدٍ إليه",
  danglingFragment.map((f) => `${f.id}: …${f.text.slice(-45)}`).join(" | ")
);

// ─────────────── ٤) لا حشوَ نقاطٍ لاحقًا يُطبع للزائر ───────────────

/**
 * ٦٤٢ فائدةً (٥٤ مختارة + ٥٨٨ في الشقيق، نحوَ ربعِ المعروض) كانت تنتهي
 * بسلسلةِ نقاطٍ حرفيّةٍ تبلغ ٢٣٨ نقطةً في أطولها — أثرُ مولِّدٍ يحشو النصَّ
 * إلى طولٍ أدنى، وتُطبع في البطاقةِ كما هي. والعتبةُ أربعُ نقاطٍ فأكثر
 * حتى لا تُمَسَّ نقاطُ الحذفِ المشروعة («…» أو ثلاثُ نقاط).
 */
const DOT_PADDING = /\.{4,}/;

const paddedCurated = FAWAID_CURATED_SEED.filter((f) => DOT_PADDING.test(f.text));
assert(
  paddedCurated.length === 0,
  "لا فائدةَ مختارةً تنتهي بحشوِ نقاطٍ",
  `${paddedCurated.length} فائدة`
);

const paddedSeed = SEED_FAWAID.filter((f) => DOT_PADDING.test(f.text));
assert(
  paddedSeed.length === 0,
  "لا فائدةَ في `fawaid-seed.ts` تنتهي بحشوِ نقاطٍ",
  `${paddedSeed.length} فائدة`
);

// ─────────────── ٥) لا تناقضَ تخريجٍ بين `source` و`author_name` ───────────────

const takhrijContradiction = FAWAID_CURATED_SEED.filter((f) => {
  const src = f.source ?? "";
  const auth = f.author_name ?? "";
  if (/متفق/.test(src)) return false; // «متفق عليه» يشمل الشيخين فلا تناقض
  const srcMuslimOnly = /(?:رواه|صحيح)\s*مسلم/.test(src) && !/البخاري/.test(src);
  const srcBukhariOnly = /(?:رواه|صحيح)\s*البخاري/.test(src) && !/مسلم/.test(src);
  return (srcMuslimOnly && /البخاري/.test(auth)) || (srcBukhariOnly && /مسلم/.test(auth));
});
assert(
  takhrijContradiction.length === 0,
  "لا سجلَّ يَنسب التخريجَ إلى أحد الشيخين ثمَّ يَنسبه في `author_name` إلى الآخر",
  takhrijContradiction.map((f) => `${f.id}: ${f.source} / ${f.author_name}`).join(" | ")
);

// ─────────────── ٥) لا تصنيفَ خارجَ شرائح الصفحة (عطلُ الاختفاء الصامت) ───────────────

/**
 * الشرائحُ المعروضةُ فعلًا في `/fawaid` = `FAWAID_CURATED_CATEGORIES` ∪
 * `LEGACY_CATEGORIES`، والأخيرةُ معرَّفةٌ داخلَ `FawaidPage.tsx` نفسِها ولا
 * تُصدَّر — فتُقرأ من الملفِّ حتى يبقى الفحصُ صادقًا على ما يُصيَّر حقًّا
 * لا على نسخةٍ مجمَّدةٍ تتقادم. وهذا العطلُ ليس نظريًّا: أُصلح في
 * ٢٠٢٦-٠٧-١٨/١٩ مرَّتين ثمَّ ارتدَّ بالضخِّ الجديد (٢٢٤ فائدةً في ج-٢٨٤).
 */
function displayedCategories(): Set<string> {
  const page = readFileSync(new URL("../../views/FawaidPage.tsx", import.meta.url), "utf8");
  const block = page.match(/const LEGACY_CATEGORIES = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error("تعذَّر استخراج LEGACY_CATEGORIES من FawaidPage.tsx");
  const legacy = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return new Set<string>([...FAWAID_CURATED_CATEGORIES, ...legacy]);
}

const shown = displayedCategories();

const orphanCategory = FAWAID_CURATED_SEED.filter((f) => !shown.has(f.category));
assert(
  orphanCategory.length === 0,
  "لا فائدةَ مختارةً بتصنيفٍ غيرِ معروضٍ في الصفحة فتختفي عند الفلترة",
  `${orphanCategory.length} فائدة — ${[...new Set(orphanCategory.map((f) => f.category))].join(", ")}`
);

// الملفُّ الشقيقُ يُدمَج مع هذا في الصفحةِ نفسِها (`demo-content.ts`) فيُحرَس معه
const orphanSeed = SEED_FAWAID.filter((f) => !shown.has(f.category));
assert(
  orphanSeed.length === 0,
  "لا فائدةَ في `fawaid-seed.ts` بتصنيفٍ غيرِ معروضٍ في الصفحة",
  `${orphanSeed.length} فائدة — ${[...new Set(orphanSeed.map((f) => f.category))].join(", ")}`
);

// ─────────────── ٦) لا نصَّ فائدةٍ فارغًا ───────────────

const emptyText = FAWAID_CURATED_SEED.filter((f) => !f.text || !f.text.trim());
assert(emptyText.length === 0, "لا نصَّ فائدةٍ فارغًا", emptyText.map((f) => f.id).join(", "));

console.log(`\n${"─".repeat(48)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
