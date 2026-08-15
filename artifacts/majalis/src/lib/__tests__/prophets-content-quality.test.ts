/**
 * بوابة محتوى قصص الأنبياء — تمنع عودة الحشو الآلي والجزم غير المحرر.
 * تشغيل: node --import tsx src/lib/__tests__/prophets-content-quality.test.ts
 */
import assert from "node:assert/strict";
import {
  PROPHETS,
  getProphet,
  resolveProphetSlug,
  type ProphetRecord,
} from "../prophets-data.ts";

const EXPECTED_ORDER = [
  "آدم",
  "إدريس",
  "نوح",
  "هود",
  "صالح",
  "إبراهيم",
  "لوط",
  "إسماعيل",
  "إسحاق",
  "يعقوب",
  "يوسف",
  "أيوب",
  "شعيب",
  "موسى",
  "هارون",
  "ذو الكفل",
  "داود",
  "سليمان",
  "إلياس",
  "اليسع",
  "يونس",
  "زكريا",
  "يحيى",
  "عيسى",
  "محمد",
] as const;

const EXPECTED_SLUGS = [
  "adam",
  "idris",
  "nuh",
  "hud",
  "salih",
  "ibrahim",
  "lut",
  "ismail",
  "is-haq",
  "yaqub",
  "yusuf",
  "ayyub",
  "shuayb",
  "musa",
  "harun",
  "dhul-kifl",
  "dawud",
  "sulayman",
  "ilyas",
  "al-yasa",
  "yunus",
  "zakariyya",
  "yahya",
  "isa",
  "muhammad",
] as const;

/** عبارات حشو آلي — أي ظهور في نصوص الأنبياء فشل */
const FORBIDDEN_PHRASES = [
  "تُربط سيرته",
  "تُربط سيرته بمقاصد القرآن",
  "ويُستفاد من قصته في بناء الإيمان والأخلاق",
  "الصبر على مقتضاه",
  "الصبر على مقتضاه من تمام الانتفاع لا مجرد الاستحسان",
  "يُسأل الله التوفيق للعمل بما علم لا لمجرد معرفة القصة",
  "يُستحضر المآل",
  "يُستحضر المآل الأخروي عند تنزيل الفائدة على الواقع",
  "يُترجم المعنى إلى طاعة ميسورة بحسب الحال",
  "دون غلو أو إسرائيليات كما دلّ الوحي بلا زيادة",
  "ويُقتدى به في بابه دون غلو أو إسرائيليات",
  "مما ثبت في القرآن أو السنة ويُقتدى به",
  "لم يتركه الشكوى لله",
  "البلدفلسطين",
  "Esc للقائمة",
  "اختصارات:",
];

function allText(p: ProphetRecord): string {
  return [p.briefBio, p.peopleOrPlace, p.era, p.title, ...p.keyAttributes, ...p.lessons].join("\n");
}

assert.equal(PROPHETS.length, 25, "يجب أن يكون عدد الأنبياء 25");
assert.deepEqual(
  PROPHETS.map((p) => p.arabicName),
  [...EXPECTED_ORDER],
  "ترتيب الأسماء العربية غير مطابق",
);
assert.deepEqual(
  PROPHETS.map((p) => p.slug),
  [...EXPECTED_SLUGS],
  "ترتيب الـslugs غير مطابق",
);

for (const p of PROPHETS) {
  assert.ok(p.briefBio.trim().length >= 40, `${p.slug}: النبذة قصيرة جداً`);
  assert.ok(p.briefBio.length <= 520, `${p.slug}: النبذة طويلة جداً (حشو محتمل)`);
  assert.ok(p.lessons.length >= 3 && p.lessons.length <= 5, `${p.slug}: عدد الدروس يجب 3–5`);
  assert.ok(p.keyAttributes.length >= 2 && p.keyAttributes.length <= 6, `${p.slug}: عدد الصفات غير منطقي`);
  for (const lesson of p.lessons) {
    assert.ok(lesson.length <= 120, `${p.slug}: درس طويل جداً: ${lesson.slice(0, 40)}…`);
  }
  const blob = allText(p);
  for (const phrase of FORBIDDEN_PHRASES) {
    assert.ok(!blob.includes(phrase), `${p.slug}: عبارة حشو محظورة: ${phrase}`);
  }
  // تكرار فقرة كاملة داخل النبذة
  const half = Math.floor(p.briefBio.length / 2);
  if (half > 80) {
    const a = p.briefBio.slice(0, half).trim();
    const b = p.briefBio.slice(half).trim();
    assert.ok(a !== b, `${p.slug}: تكرار حرفي في النبذة`);
  }
}

assert.equal(resolveProphetSlug("ishaq"), "is-haq");
assert.equal(resolveProphetSlug("alyasa"), "al-yasa");
assert.equal(resolveProphetSlug("zakariya"), "zakariyya");
assert.equal(resolveProphetSlug("zakaria"), "zakariyya");
assert.equal(getProphet("ishaq")?.slug, "is-haq");
assert.equal(getProphet("alyasa")?.slug, "al-yasa");
assert.equal(getProphet("zakariya")?.slug, "zakariyya");
assert.equal(getProphet("zakaria")?.slug, "zakariyya");
assert.equal(getProphet("is-haq")?.arabicName, "إسحاق");
assert.equal(getProphet("al-yasa")?.arabicName, "اليسع");
assert.equal(getProphet("zakariyya")?.arabicName, "زكريا");

const ayyub = getProphet("ayyub")!;
assert.ok(ayyub.keyAttributes.some((a) => a.includes("شكواه إلى الله")));
assert.ok(ayyub.peopleOrPlace.includes("غير محدد") || ayyub.era.includes("غير محدد"));

const yahya = getProphet("yahya")!;
assert.ok(yahya.briefBio.includes("ولا يُبنى عليها تفصيل جازم") || yahya.briefBio.includes("دون تثبت"));

const idris = getProphet("idris")!;
assert.ok(idris.briefBio.includes("ولا يثبت منها شيء"));

const dhul = getProphet("dhul-kifl")!;
assert.ok(dhul.briefBio.includes("وقع خلاف") || dhul.briefBio.includes("خلاف"));

const yasa = getProphet("al-yasa")!;
assert.ok(yasa.briefBio.includes("ولم يثبت تفصيل"));

const muhammad = getProphet("muhammad")!;
assert.ok(muhammad.briefBio.includes("تُؤخذ سيرته من القرآن والسنة"));
assert.ok(!muhammad.briefBio.includes("إسرائيليات"));

const isa = getProphet("isa")!;
assert.ok(isa.title.includes("عبد الله") || isa.quranTitle?.includes("كلمة الله"));

console.log(`prophets-content-quality: OK — ${PROPHETS.length} نبيًا بلا حشو محظور`);
