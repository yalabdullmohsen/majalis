/**
 * اختبارات ذهبية لمحرك المواريث — مبنية على القواعد الفقهية المُجمَع عليها
 * (فروض القرآن الثابتة، وقواعد التعصيب والحجب والعول والرد كما تُدرَّس في
 * كتب الفرائض المعتمدة كالرحبية وشروحها). كل حالة أدناه محسوبة يدويًا
 * ومُتحقَّق منها قبل إدراجها هنا؛ الحالات المعقّدة جدًا (كالمشرَّكة والأكدرية
 * بتفاصيلهما الدقيقة) تُختبَر بحذر مع بيان المرجع الحسابي في التعليق.
 *
 * تنبيه هام: هذه اختبارات للمنطق الحسابي المبني على القواعد الفقهية القياسية
 * المتفَق عليها عند جمهور الفقهاء، وليست مراجعة نصية لكتاب فرائض بعينه (لا
 * تتوفر نصوصه هنا رقميًا للمطابقة الحرفية). يُوصى بمراجعة عالِم مختص في
 * الفرائض قبل اعتماد المحرك في حالات حقيقية، خصوصًا المسائل المُعلَّمة
 * "حالة خاصة" هنا.
 *
 * تُشغَّل عبر: npx tsx src/lib/inheritance/__tests__/engine.test.ts
 */
import { calculateInheritance } from "../engine";
import { Fraction } from "../fraction";
import { DEFAULT_FIQH_CONFIG, type HeirsInput, type HeirShareResult } from "../types";

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

function findShare(shares: HeirShareResult[], heir: string): HeirShareResult | undefined {
  return shares.find((s) => s.heir === heir);
}

function assertShare(shares: HeirShareResult[], heir: string, expectedNum: bigint, expectedDen: bigint, label: string) {
  const s = findShare(shares, heir);
  const expected = new Fraction(expectedNum, expectedDen);
  assert(
    !!s && s.totalShare.equals(expected),
    label,
    s ? `توقعت ${expected.toString()} ولكن حصلت على ${s.totalShare.toString()}` : `لم يوجد نصيب لـ ${heir} إطلاقًا`,
  );
}

function assertSumIsOne(shares: HeirShareResult[], label: string) {
  let sum = Fraction.zero();
  for (const s of shares) sum = sum.add(s.totalShare);
  assert(sum.equals(new Fraction(1n)), label + " — مجموع الأنصبة = 1", `المجموع الفعلي: ${sum.toString()}`);
}

function calc(heirs: HeirsInput, config = DEFAULT_FIQH_CONFIG) {
  return calculateInheritance(heirs, config);
}

console.log("\n═══ اختبارات الحساب الكسري (Fraction) ═══");
{
  const a = new Fraction(1n, 2n);
  const b = new Fraction(1n, 3n);
  assert(a.add(b).equals(new Fraction(5n, 6n)), "1/2 + 1/3 = 5/6");
  assert(a.sub(b).equals(new Fraction(1n, 6n)), "1/2 - 1/3 = 1/6");
  assert(a.mul(b).equals(new Fraction(1n, 6n)), "1/2 × 1/3 = 1/6");
  assert(a.div(b).equals(new Fraction(3n, 2n)), "1/2 ÷ 1/3 = 3/2");
  assert(new Fraction(4n, 8n).equals(new Fraction(1n, 2n)), "4/8 تُبسَّط تلقائيًا إلى 1/2");
  assert(new Fraction(-2n, 4n).equals(new Fraction(-1n, 2n)), "الإشارة السالبة تُبسَّط بشكل صحيح");
  assert(new Fraction(2n, -4n).equals(new Fraction(-1n, 2n)), "القاسم السالب يُطبَّع للبسط");
  assert(a.toDecimal(2) === 0.5, "1/2 كعدد عشري = 0.5");
  assert(new Fraction(1n, 2n).toArabicLabel() === "النصف", "تسمية عربية: النصف");
  assert(new Fraction(2n, 3n).toArabicLabel() === "الثلثان", "تسمية عربية: الثلثان");
}

console.log("\n═══ حالات أحادية الوارث (رد كامل أو تعصيب كامل) ═══");
{
  const r1 = calc({ sons: 1 });
  assertShare(r1.shares, "sons", 1n, 1n, "ابن واحد فقط ← كل التركة تعصيبًا");

  const r2 = calc({ daughters: 1 });
  assertShare(r2.shares, "daughters", 1n, 1n, "بنت واحدة فقط بلا عصبة ← النصف فرضًا + النصف ردًّا = الكل");
  assert(r2.radd, "حالة البنت المنفردة: علامة الرد مُفعَّلة");

  const r3 = calc({ mother: 1 });
  assertShare(r3.shares, "mother", 1n, 1n, "أم واحدة فقط ← الثلث فرضًا + الثلثان ردًّا = الكل");

  const r4 = calc({ father: 1 });
  assertShare(r4.shares, "father", 1n, 1n, "أب واحد فقط بلا فرع وارث ← عصبة بالكامل");

  const r5 = calc({ husband: 1 });
  assertShare(r5.shares, "husband", 1n, 2n, "زوج واحد فقط بلا ورثة آخرين ← النصف فقط (لا ردّ للزوجين افتراضيًا)");
  assert(r5.warnings.length > 0, "زوج منفرد: تحذير بوجود بقية بلا مستحق معروف");

  const r6 = calc({ wife: 1 });
  assertShare(r6.shares, "wife", 1n, 4n, "زوجة واحدة فقط بلا ورثة آخرين ← الربع فقط (لا ردّ)");
}

console.log("\n═══ فروض الزوجين الأساسية ═══");
{
  const r1 = calc({ husband: 1, sons: 1 });
  assertShare(r1.shares, "husband", 1n, 4n, "زوج + ابن ← ربع للزوج (لوجود فرع وارث)");
  assertShare(r1.shares, "sons", 3n, 4n, "زوج + ابن ← الباقي (3/4) للابن تعصيبًا");
  assertSumIsOne(r1.shares, "زوج + ابن");

  const r2 = calc({ wife: 1, sons: 1 });
  assertShare(r2.shares, "wife", 1n, 8n, "زوجة + ابن ← ثمن للزوجة (لوجود فرع وارث)");
  assertShare(r2.shares, "sons", 7n, 8n, "زوجة + ابن ← الباقي (7/8) للابن");

  const r3 = calc({ wife: 2, sons: 1 });
  const w = findShare(r3.shares, "wife")!;
  assert(w.totalShare.equals(new Fraction(1n, 8n)), "زوجتان: مجموع نصيبهما الثمن كاملًا");
  assert(w.perPersonShare.equals(new Fraction(1n, 16n)), "زوجتان: نصيب كل واحدة 1/16 (الثمن ÷ 2)");
}

console.log("\n═══ حالة العمريتين (الغرّاوان) — زوج/زوجة + أب + أم ═══");
{
  // زوج + أب + أم: للزوج 1/2، للأم ثلث الباقي (1/2 × 1/3 = 1/6)، والباقي (1/3) للأب
  const r1 = calc({ husband: 1, father: 1, mother: 1 });
  assertShare(r1.shares, "husband", 1n, 2n, "العمريتان (زوج): نصف للزوج");
  assertShare(r1.shares, "mother", 1n, 6n, "العمريتان (زوج): ثلث الباقي للأم = 1/6 من كل التركة (لا ثلث كامل)");
  assertSumIsOne(r1.shares, "العمريتان بزوج");
  const fatherShare1 = findShare(r1.shares, "father")!;
  assert(fatherShare1.totalShare.equals(new Fraction(1n, 3n)), "العمريتان (زوج): للأب الباقي = 1/3");

  // زوجة + أب + أم: للزوجة 1/4، للأم ثلث الباقي (3/4 × 1/3 = 1/4)، والباقي (1/2) للأب
  const r2 = calc({ wife: 1, father: 1, mother: 1 });
  assertShare(r2.shares, "wife", 1n, 4n, "العمريتان (زوجة): ربع للزوجة");
  assertShare(r2.shares, "mother", 1n, 4n, "العمريتان (زوجة): ثلث الباقي للأم = 1/4 من كل التركة");
  assertSumIsOne(r2.shares, "العمريتان بزوجة");
}

console.log("\n═══ العول (Awl) — أصول 6 و12 و24 المعروفة ═══");
{
  // زوج + أختان شقيقتان: 1/2 + 2/3 = 3/6 + 4/6 = 7/6 ← يعول الأصل من 6 إلى 7
  const r1 = calc({ husband: 1, fullSisters: 2 });
  const h1 = findShare(r1.shares, "husband")!;
  const s1 = findShare(r1.shares, "fullSisters")!;
  assert(h1.totalShare.equals(new Fraction(3n, 7n)), "عول 6→7: نصيب الزوج 3/7", h1.totalShare.toString());
  assert(s1.totalShare.equals(new Fraction(4n, 7n)), "عول 6→7: نصيب الأختين 4/7", s1.totalShare.toString());
  assertSumIsOne(r1.shares, "عول 6→7 (زوج + أختان شقيقتان)");
  assert(r1.awlBase === 7n, "عول 6→7: أصل المسألة بعد العول = 7", `الفعلي: ${r1.awlBase}`);
  assert(r1.originalBase === 6n, "عول 6→7: الأصل قبل العول = 6", `الفعلي: ${r1.originalBase}`);

  // زوجة + أم + أختان شقيقتان: 1/4 + 1/6 + 2/3 = 3/12+2/12+8/12 = 13/12 ← عول 12→13
  const r2 = calc({ wife: 1, mother: 1, fullSisters: 2 });
  assertSumIsOne(r2.shares, "عول 12→13 (زوجة + أم + أختان شقيقتان)");
  assert(r2.awlBase === 13n, "عول 12→13: الأصل بعد العول = 13", `الفعلي: ${r2.awlBase}`);

  // زوج + أم + أختان شقيقتان: 1/2 + 1/6 + 2/3 = 3/6+1/6+4/6=8/6=4/3 ← يبسَّط، عول 6→8
  const r3 = calc({ husband: 1, mother: 1, fullSisters: 2 });
  assertSumIsOne(r3.shares, "عول 6→8 (زوج + أم + أختان شقيقتان)");
  assert(r3.awlBase === 8n, "عول 6→8: الأصل بعد العول = 8 (رغم اختزال المجموع إلى 4/3)", `الفعلي: ${r3.awlBase}`);

  // زوجة + أختان شقيقتان + أخ لأم: 1/4 + 2/3 + 1/6 = 3/12+8/12+2/12=13/12 ← عول 12→13
  const r4 = calc({ wife: 1, fullSisters: 2, maternalBrothers: 1 });
  assertSumIsOne(r4.shares, "عول 12→13 (زوجة + أختان شقيقتان + أخ لأم)");
}

console.log("\n═══ الرد (Radd) ═══");
{
  // بنت + أم: 1/2 + 1/6 = 2/3، الباقي 1/3 يُرَدّ عليهما بنسبة أنصبتهما (لا عصبة)
  const r1 = calc({ daughters: 1, mother: 1 });
  assertSumIsOne(r1.shares, "رد: بنت + أم");
  const d1 = findShare(r1.shares, "daughters")!;
  const m1 = findShare(r1.shares, "mother")!;
  // نسبة الردّ: البنت أصلاً 1/2 (=3/6) من أصل 4/6 (الفروض)، فتأخذ 3/4 من الكل؛ الأم 1/6(=1/6) فتأخذ 1/4
  assert(d1.totalShare.equals(new Fraction(3n, 4n)), "رد بنت+أم: البنت 3/4", d1.totalShare.toString());
  assert(m1.totalShare.equals(new Fraction(1n, 4n)), "رد بنت+أم: الأم 1/4", m1.totalShare.toString());

  // زوجة + بنت + لا عصبة: الزوجة لا تأخذ من الرد (الإعداد الافتراضي)
  const r2 = calc({ wife: 1, daughters: 1 });
  const w2 = findShare(r2.shares, "wife")!;
  const d2 = findShare(r2.shares, "daughters")!;
  assert(w2.totalShare.equals(new Fraction(1n, 8n)), "زوجة + بنت: الزوجة تبقى على الثمن (لا ردّ لها)", w2.totalShare.toString());
  assert(d2.totalShare.equals(new Fraction(7n, 8n)), "زوجة + بنت: البنت تأخذ الباقي كله (النصف + كل الرد)", d2.totalShare.toString());
  assertSumIsOne(r2.shares, "زوجة + بنت (بلا عصبة)");
}

console.log("\n═══ التعصيب بالغير (البنات مع الابن، الأخوات مع الإخوة) ═══");
{
  const r1 = calc({ sons: 1, daughters: 1 });
  const s1 = findShare(r1.shares, "sons")!;
  const d1 = findShare(r1.shares, "daughters")!;
  assert(s1.totalShare.equals(new Fraction(2n, 3n)), "ابن + بنت: للابن ضعف البنت = 2/3", s1.totalShare.toString());
  assert(d1.totalShare.equals(new Fraction(1n, 3n)), "ابن + بنت: للبنت 1/3", d1.totalShare.toString());

  const r2 = calc({ sons: 2, daughters: 1 });
  const s2 = findShare(r2.shares, "sons")!;
  assert(s2.perPersonShare.equals(new Fraction(2n, 5n)), "ابنان + بنت: نصيب كل ابن 2/5 من الكل (5 أسهم: 2+2+1)", s2.perPersonShare.toString());

  const r3 = calc({ fullBrothers: 1, fullSisters: 1 });
  const b3 = findShare(r3.shares, "fullBrothers")!;
  const si3 = findShare(r3.shares, "fullSisters")!;
  assert(b3.totalShare.equals(new Fraction(2n, 3n)), "أخ شقيق + أخت شقيقة (بلا ورثة آخرين): للأخ ضعف الأخت", b3.totalShare.toString());
  assert(si3.totalShare.equals(new Fraction(1n, 3n)), "أخ شقيق + أخت شقيقة: للأخت 1/3", si3.totalShare.toString());
}

console.log("\n═══ التعصيب مع الغير (الأخت الشقيقة مع البنت) ═══");
{
  // بنت واحدة + أخت شقيقة: للبنت النصف فرضًا، وللأخت الباقي (النصف) عصبة مع الغير
  const r1 = calc({ daughters: 1, fullSisters: 1 });
  const d1 = findShare(r1.shares, "daughters")!;
  const s1 = findShare(r1.shares, "fullSisters")!;
  assert(d1.totalShare.equals(new Fraction(1n, 2n)), "بنت + أخت شقيقة: البنت نصف فرضًا", d1.totalShare.toString());
  assert(s1.totalShare.equals(new Fraction(1n, 2n)), "بنت + أخت شقيقة: الأخت الباقي عصبة مع الغير", s1.totalShare.toString());
  assert(s1.basis === "asaba-with-daughters" || s1.basis === "asaba", "بنت + أخت شقيقة: أساس نصيب الأخت تعصيب مع الغير");
  assertSumIsOne(r1.shares, "بنت + أخت شقيقة");
}

console.log("\n═══ الحجب ═══");
{
  const r1 = calc({ sons: 1, sonsOfSon: 1, fullBrothers: 1 });
  assert(findShare(r1.shares, "sonsOfSon") === undefined, "الابن يحجب ابن الابن حرمانًا");
  assert(findShare(r1.shares, "fullBrothers") === undefined, "الابن يحجب الإخوة الأشقاء حرمانًا");
  assert(r1.hajbLog.some((e) => e.heir === "sonsOfSon"), "سجلّ الحجب يوثِّق حجب ابن الابن");

  const r2 = calc({ father: 1, fullBrothers: 2, paternalBrothers: 2 });
  assert(findShare(r2.shares, "fullBrothers") === undefined, "الأب يحجب الإخوة الأشقاء");
  assert(findShare(r2.shares, "paternalBrothers") === undefined, "الأب يحجب الإخوة لأب");
  assertShare(r2.shares, "father", 1n, 1n, "أب منفرد بعد حجب الإخوة ← يأخذ كل التركة");

  const r3 = calc({ fullBrothers: 1, paternalBrothers: 3 });
  assert(findShare(r3.shares, "paternalBrothers") === undefined, "الأخ الشقيق الواحد يحجب الإخوة لأب");
  assertShare(r3.shares, "fullBrothers", 1n, 1n, "أخ شقيق منفرد بعد حجب إخوة لأب ← كل التركة");

  const r4 = calc({ mother: 1, sons: 1, maternalBrothers: 2, fullBrothers: 3 });
  assert(findShare(r4.shares, "maternalBrothers") === undefined, "الفرع الوارث (الابن) يحجب الإخوة لأم");

  const r5 = calc({ father: 1, paternalGrandfather: 1 });
  assert(findShare(r5.shares, "paternalGrandfather") === undefined, "الأب يحجب الجد حرمانًا");

  const r6 = calc({ mother: 1, paternalGrandmother: 1, maternalGrandmother: 1 });
  assert(findShare(r6.shares, "paternalGrandmother") === undefined, "الأم تحجب الجدة لأب");
  assert(findShare(r6.shares, "maternalGrandmother") === undefined, "الأم تحجب الجدة لأم");
}

console.log("\n═══ الجدتان (تشتركان في السدس) ═══");
{
  const r1 = calc({ paternalGrandmother: 1, maternalGrandmother: 1, sons: 1 });
  const pg = findShare(r1.shares, "paternalGrandmother")!;
  const mg = findShare(r1.shares, "maternalGrandmother")!;
  assert(pg.totalShare.equals(new Fraction(1n, 12n)), "جدتان: كل واحدة 1/12 (نصف السدس)", pg.totalShare.toString());
  assert(mg.totalShare.equals(new Fraction(1n, 12n)), "جدتان: كل واحدة 1/12 (نصف السدس)", mg.totalShare.toString());
}

console.log("\n═══ الإخوة لأم (كلالة) ═══");
{
  const r1 = calc({ mother: 1, maternalBrothers: 1, fullBrothers: 1 });
  assertShare(r1.shares, "maternalBrothers", 1n, 6n, "أخ لأم واحد (كلالة) ← السدس");

  const r2 = calc({ mother: 1, maternalBrothers: 1, maternalSisters: 1, fullBrothers: 2 });
  const mb2 = findShare(r2.shares, "maternalBrothers")!;
  const ms2 = findShare(r2.shares, "maternalSisters")!;
  assert(mb2.totalShare.equals(new Fraction(1n, 6n)), "أخ وأخت لأم: الثلث يُقسَّم بالتساوي، كل واحد سدس", mb2.totalShare.toString());
  assert(ms2.totalShare.equals(new Fraction(1n, 6n)), "أخ وأخت لأم: الثلث يُقسَّم بالتساوي، كل واحد سدس (لا للذكر مثل حظ الأنثيين هنا)", ms2.totalShare.toString());
}

console.log("\n═══ مسائل مركّبة (تحقّق من التوازن العام: المجموع = 1) ═══");
{
  const cases: HeirsInput[] = [
    { husband: 1, mother: 1, father: 1 },
    { wife: 1, mother: 1, father: 1, daughters: 1 },
    { wife: 4, sons: 2, daughters: 3 },
    { husband: 1, daughters: 2, fullBrothers: 1 },
    { father: 1, mother: 1, sons: 1, daughters: 2 },
    { mother: 1, paternalGrandfather: 1, fullBrothers: 2 },
    { husband: 1, paternalGrandfather: 1, mother: 1 },
    { wife: 1, sonsOfSon: 1, daughtersOfSon: 1 },
    { daughters: 1, sons: 1, wife: 1, father: 1, mother: 1 },
    { fullSisters: 2, paternalBrothers: 2, mother: 1 },
    { paternalGrandmother: 1, fullSisters: 1, fullBrothers: 1 },
    { husband: 1, fullSisters: 1, maternalBrothers: 2, maternalSisters: 1 },
    { daughtersOfSon: 2, sons: 0, daughters: 1, wife: 1 },
    { mother: 1, fullBrothers: 1, fullSisters: 3 },
    { father: 1, daughters: 3 },
  ];
  for (const c of cases) {
    const r = calc(c);
    if (r.shares.length > 0) {
      assertSumIsOne(r.shares, `مسألة: ${JSON.stringify(c)}`);
    }
  }
}

console.log("\n═══ حالات حدّية ═══");
{
  const r1 = calc({});
  assert(r1.warnings.length > 0, "لا ورثة إطلاقًا ← تحذير صريح بلا كسر برمجي");
  assert(r1.shares.length === 0, "لا ورثة إطلاقًا ← لا أنصبة");

  let threw = false;
  try {
    calc({ husband: 2 } as HeirsInput);
  } catch {
    threw = true;
  }
  assert(threw, "أكثر من زوج واحد ← خطأ مرفوض");

  threw = false;
  try {
    calc({ wife: 5 } as HeirsInput);
  } catch {
    threw = true;
  }
  assert(threw, "أكثر من 4 زوجات ← خطأ مرفوض");

  threw = false;
  try {
    calc({ husband: 1, wife: 1 } as HeirsInput);
  } catch {
    threw = true;
  }
  assert(threw, "اجتماع زوج وزوجة في مسألة واحدة ← خطأ مرفوض");

  threw = false;
  try {
    calc({ sons: -1 } as HeirsInput);
  } catch {
    threw = true;
  }
  assert(threw, "عدد وارث سالب ← خطأ مرفوض");
}

console.log("\n═══ حالة المشرَّكة (الحمارية) — زوج + أم + إخوة لأم (٢+) + إخوة أشقاء ═══");
{
  // بلا حكم المشاركة: الفروض (1/2+1/6+1/3=1) تستغرق التركة، فلا يبقى للأخ الشقيق شيء
  const raw = calc(
    { husband: 1, mother: 1, fullBrothers: 1, maternalBrothers: 2 },
    { ...DEFAULT_FIQH_CONFIG, mushtarakaShareWithMaternalSiblings: false },
  );
  const fbRaw = findShare(raw.shares, "fullBrothers");
  assert(!fbRaw || fbRaw.totalShare.isZero(), "المشرَّكة بلا مشاركة: الأخ الشقيق نصيبه صفر (القياس المجرَّد)");
  assertSumIsOne(raw.shares, "المشرَّكة بلا مشاركة");

  // بحكم الجمهور (الافتراضي): يُشرَّك الأخ الشقيق مع إخوة الأم في الثلث بالتساوي للرأس
  const shared = calc({ husband: 1, mother: 1, fullBrothers: 1, maternalBrothers: 2 });
  const fbShared = findShare(shared.shares, "fullBrothers")!;
  const mbShared = findShare(shared.shares, "maternalBrothers")!;
  assert(fbShared.totalShare.equals(new Fraction(1n, 9n)), "المشرَّكة بالمشاركة: الأخ الشقيق 1/9 (ثلث الثلث المشترك بين 3 رؤوس)", fbShared.totalShare.toString());
  assert(mbShared.totalShare.equals(new Fraction(2n, 9n)), "المشرَّكة بالمشاركة: أخوا الأم معًا 2/9", mbShared.totalShare.toString());
  assertSumIsOne(shared.shares, "المشرَّكة بالمشاركة (زوج+أم+أخ شقيق+أخوا أم)");

  // تحقق أن المشرَّكة لا تنطبق مع زوجة بدل زوج (لا تنشأ نفس المعضلة الحسابية)
  const withWife = calc({ wife: 1, mother: 1, fullBrothers: 1, maternalBrothers: 2 });
  const fbWife = findShare(withWife.shares, "fullBrothers")!;
  assert(fbWife.totalShare.isPositive() && !fbWife.totalShare.equals(new Fraction(1n, 9n)), "مع زوجة بدل زوج: لا تنشأ معضلة المشرَّكة، الأخ الشقيق عصبة عادية بنصيب مختلف", fbWife.totalShare.toString());
  assertSumIsOne(withWife.shares, "زوجة (لا زوج) + أم + أخ شقيق + أخوا أم");
}

console.log("\n═══ إعداد فقهي قابل للتخصيص (FiqhConfig) ═══");
{
  // الجد مع الإخوة: المقاسمة (افتراضي) مقابل إسقاط الجد للإخوة
  const withMuqasama = calc({ paternalGrandfather: 1, fullBrothers: 2 }, { ...DEFAULT_FIQH_CONFIG, grandfatherWithSiblings: "muqasama" });
  const gf1 = findShare(withMuqasama.shares, "paternalGrandfather")!;
  assert(gf1.totalShare.lessThan(new Fraction(1n)), "مقاسمة: للجد أقل من كامل التركة (يشارك الإخوة)", gf1.totalShare.toString());
  assertSumIsOne(withMuqasama.shares, "الجد بالمقاسمة مع إخوة أشقاء");

  const withExclusion = calc({ paternalGrandfather: 1, fullBrothers: 2 }, { ...DEFAULT_FIQH_CONFIG, grandfatherWithSiblings: "grandfatherExcludes" });
  assertShare(withExclusion.shares, "paternalGrandfather", 1n, 1n, "إسقاط: الجد يأخذ كل التركة ويُسقط الإخوة (حسب الإعداد)");
  assert(findShare(withExclusion.shares, "fullBrothers") === undefined, "إسقاط: الإخوة محجوبون تمامًا بالجد حسب الإعداد المختار");
}

console.log("\n═══ عول أصل 24 ═══");
{
  // زوجة + بنتان + أب + أم: 1/8 + 2/3 + 1/6 + 1/6 = 3/24+16/24+4/24+4/24=27/24 ← عول 24→27
  const r1 = calc({ wife: 1, daughters: 2, father: 1, mother: 1 });
  assertSumIsOne(r1.shares, "عول 24→27 (زوجة + بنتان + أب + أم)");
  assert(r1.awlBase === 27n, "عول 24→27: الأصل بعد العول = 27", `الفعلي: ${r1.awlBase}`);
  const w1 = findShare(r1.shares, "wife")!;
  assert(w1.totalShare.equals(new Fraction(3n, 27n)), "عول 24→27: نصيب الزوجة 3/27", w1.totalShare.toString());
}

console.log("\n═══ فروع الفروع (أبناء الابن وبنات الابن) ═══");
{
  // ابن ابن واحد فقط: يقوم مقام الابن تمامًا
  const r1 = calc({ sonsOfSon: 1 });
  assertShare(r1.shares, "sonsOfSon", 1n, 1n, "ابن ابن منفرد ← كل التركة تعصيبًا (يقوم مقام الابن)");

  // بنت ابن واحدة بلا بنات حقيقيات ولا ابن ابن: كالبنت المنفردة (نصف + رد)
  const r2 = calc({ daughtersOfSon: 1 });
  assertShare(r2.shares, "daughtersOfSon", 1n, 1n, "بنت ابن منفردة بلا وارث آخر ← نصف فرضًا + نصف ردًّا = الكل");

  // بنت واحدة + بنت ابن واحدة + أب (عصبة تمنع الردّ): البنت نصف، بنت الابن سدس تكملة الثلثين، الباقي للأب
  const r3 = calc({ daughters: 1, daughtersOfSon: 1, father: 1 });
  assertShare(r3.shares, "daughters", 1n, 2n, "بنت + بنت ابن + أب: البنت نصف فرضًا");
  assertShare(r3.shares, "daughtersOfSon", 1n, 6n, "بنت + بنت ابن + أب: بنت الابن سدس تكملةً للثلثين");
  assertShare(r3.shares, "father", 1n, 3n, "بنت + بنت ابن + أب: الباقي (الثلث) للأب تعصيبًا");
  assertSumIsOne(r3.shares, "بنت + بنت ابن + أب");

  // بنت واحدة + بنت ابن واحدة بلا أي وارث آخر: لا عصبة ← يُرَدّ الباقي عليهما بنسبة 3:1 (فرضاهما 1/2 و1/6)
  const r3b = calc({ daughters: 1, daughtersOfSon: 1 });
  assertShare(r3b.shares, "daughters", 3n, 4n, "بنت + بنت ابن (بلا عصبة): البنت 3/4 بعد الردّ (فرضها 1/2 من أصل الفروض 2/3)");
  assertShare(r3b.shares, "daughtersOfSon", 1n, 4n, "بنت + بنت ابن (بلا عصبة): بنت الابن 1/4 بعد الردّ (فرضها 1/6 من أصل الفروض 2/3)");
  assert(r3b.radd, "بنت + بنت ابن بلا عصبة: علامة الرد مُفعَّلة");
  assertSumIsOne(r3b.shares, "بنت + بنت ابن (بلا عصبة، بالرد)");

  // بنتان حقيقيتان + بنت ابن (بلا ابن ابن) + أب: بنت الابن محجوبة، والباقي بعد الثلثين للأب
  const r4 = calc({ daughters: 2, daughtersOfSon: 1, father: 1 });
  assert(findShare(r4.shares, "daughtersOfSon") === undefined, "بنتان + بنت ابن بلا ابن ابن ← بنت الابن محجوبة (الثلثان اكتملا)");
  assertShare(r4.shares, "daughters", 2n, 3n, "بنتان + بنت ابن (محجوبة) + أب ← الثلثان للبنتين");
  assertShare(r4.shares, "father", 1n, 3n, "بنتان + بنت ابن (محجوبة) + أب ← الباقي (الثلث) للأب");
  assertSumIsOne(r4.shares, "بنتان + بنت ابن (محجوبة) + أب");

  // بنتان حقيقيتان + بنت ابن + ابن ابن: بنت الابن تُعصَّب بابن الابن (لا تُحجب)
  const r5 = calc({ daughters: 2, daughtersOfSon: 1, sonsOfSon: 1 });
  const dos5 = findShare(r5.shares, "daughtersOfSon");
  assert(!!dos5 && dos5.totalShare.isPositive(), "بنتان + بنت ابن + ابن ابن ← بنت الابن تُعصَّب بابن الابن ولا تُحجب");
  assertSumIsOne(r5.shares, "بنتان + بنت ابن + ابن ابن");
}

console.log("\n═══ حساب صافي التركة (estate.ts) ═══");
{
  const { computeEstateBreakdown } = await import("../estate");

  const e1 = computeEstateBreakdown({
    assets: [{ id: "1", label: "نقد", value: 100_000 }],
    debts: 10_000,
    funeralCosts: 2_000,
    bequest: 0,
    bequestApprovedByHeirs: false,
  });
  assert(e1.netForHeirs === 88_000, "تركة بسيطة: 100000 - 2000 تجهيز - 10000 دين = 88000 صافي", String(e1.netForHeirs));

  const e2 = computeEstateBreakdown({
    assets: [{ id: "1", label: "نقد", value: 90_000 }],
    debts: 0,
    funeralCosts: 0,
    bequest: 40_000,
    bequestApprovedByHeirs: false,
  });
  assert(e2.bequestCapped, "وصية تتجاوز الثلث بلا إجازة الورثة ← تُقيَّد بالثلث");
  assert(e2.bequestPaid === 30_000, "وصية 40000 من أصل 90000 بلا إجازة ← تُنفَّذ 30000 فقط (الثلث)", String(e2.bequestPaid));
  assert(e2.netForHeirs === 60_000, "صافي الورثة بعد تقييد الوصية بالثلث = 60000", String(e2.netForHeirs));

  const e3 = computeEstateBreakdown({
    assets: [{ id: "1", label: "نقد", value: 90_000 }],
    debts: 0,
    funeralCosts: 0,
    bequest: 40_000,
    bequestApprovedByHeirs: true,
  });
  assert(!e3.bequestCapped, "نفس الوصية بإجازة الورثة ← لا تقييد");
  assert(e3.bequestPaid === 40_000, "بإجازة الورثة: تُنفَّذ الوصية كاملة 40000", String(e3.bequestPaid));

  const e4 = computeEstateBreakdown({
    assets: [{ id: "1", label: "نقد", value: 5_000 }],
    debts: 20_000,
    funeralCosts: 0,
    bequest: 0,
    bequestApprovedByHeirs: false,
  });
  assert(e4.netForHeirs === 0, "ديون تستغرق التركة بالكامل ← صافي صفر للورثة", String(e4.netForHeirs));
  assert(e4.warnings.length > 0, "ديون تستغرق التركة ← تحذير صريح");

  let threwNeg = false;
  try {
    computeEstateBreakdown({ assets: [], debts: -1, funeralCosts: 0, bequest: 0, bequestApprovedByHeirs: false });
  } catch { threwNeg = true; }
  assert(threwNeg, "دين سالب ← خطأ مرفوض");
}

console.log(`\n═══ النتيجة: ${passed} نجح، ${failed} فشل ═══\n`);
if (failed > 0) process.exit(1);
