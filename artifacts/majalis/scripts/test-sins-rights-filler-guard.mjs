#!/usr/bin/env node
/**
 * حارس الحشو القالبي في «الذنوب والحقوق» (الفحص 20 — ج-٤٠٢، 2026-08-01).
 *
 * الحقلان `shortDescription` و`explanation` يبلغان الزائرَ كلاهما:
 * الأول عنوانٌ فرعيّ في صفحة الموضوع (SinsAndRightsDetailPage.tsx:82) وmeta
 * description ووصفٌ في JSON-LD (:36 و:45) ونصُّ البطاقة في القائمة
 * (SinsAndRightsPage.tsx:231)، والثاني متنُ الصفحة (:132).
 *
 * كشف عند إنشائه (ج-٤٠٢) أن الحقلين كانا محشوَّين في 26/26 موضوعًا: 23
 * منها `explanation` بطول 500 محرفًا بالضبط — أثرُ حدٍّ آليٍّ اسمه
 * `SINS_EXPL_MIN = 500` في scripts/enrich-round103-seed-raises.mjs وأخواتها
 * (17 دورة enrich تحمل الدالة `enrichSinExplanation` نفسها) — وتُكمَّل البقية
 * بسلاسل نقاط عمياء تبلغ 89 نقطة داخل النص المعروض. وأُعيدت الحقول الـ52
 * إلى نصِّها المحفوظ في تاريخ الملف نفسه (2c094c1a9، ما قبل دورة الإثراء 34)،
 * وقد ثبت أن ذلك النصَّ — بلا نقطته الأخيرة — بادئةٌ حرفية للنص المحشوِّ في
 * 52/52 حقلًا ⇒ فالاستعادة حذفٌ محضٌ لذيلٍ مولَّد لا إعادةَ صياغة.
 *
 * وخطر الحشو ليس الإطالة: جمله تُخبر عن الموضوع بما ليس فيه — «ويُعرض الحكم
 * على الكتاب والسنة الصحيحة دون التهوين أو التشديد بلا دليل» تُذيَّل بموضوعٍ
 * لا يزيد دليله على آيةٍ وحديث ⇒ دعوى منهجٍ لا وصفَ محتوى.
 *
 * الشرط: لا يبلغ الزائرَ حقلٌ فيه جملةٌ قالبية معروفة، ولا سلسلة نقاط (3+)،
 * ولا جملةٌ تتكرر حرفيًا في ثلاثة موضوعات فأكثر (كاشف الحشو العام)، ولا
 * `relatedSlugs` يشير إلى موضوع غير موجود، ولا تعارُضَ بين `topicSlugs`
 * في التصنيف و`rightsCategory` في الموضوع (فالبطاقة تبني قائمتها على الثاني
 * وتبني شارة «+ قيد الإعداد» على الأول — SinsAndRightsPage.tsx:494 و:513).
 *
 * التشغيل: node --import tsx scripts/test-sins-rights-filler-guard.mjs
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { SINS_TOPICS, SINS_CATEGORIES } = await import(
  pathToFileURL(path.join(ROOT, "src/lib/sins-rights-data.ts")).href
);

/** الجمل القالبية: سبعٌ منقولةٌ بحرفها من مولِّداتها في scripts/enrich-*.mjs، وأربعٌ أثبتها الكاشف العام */
const FILLER_PHRASES = [
  "مع اجتناب التجسس والغيبة باسم النصيحة",
  "والستر حيث يشرع الستر مع التوبة والإقلاع",
  "يستحضر تعظيم حدود الله لا التشهير بالناس",
  "مع التوبة والإقلاع ورد المظالم إن وجدت",
  "من باب حقوق الله أو حقوق العباد بحسب تصنيف المسألة",
  "مع التمييز بين التوبة الصادقة والإصرار على المعصية",
  "يستحضر عند ذكره تعظيم حدود الله لا التشهير بالناس",
  "والعلاج بالاستغفار والكف ورد المظالم إن وجدت، مع سؤال التوفيق",
  "وهو محرم لما فيه من مخالفة أمر الله أو الاعتداء على حق الغير",
  "والتوبة منه واجبة مع الإقلاع والعزم ورد الحق إن تعلق بآدمي",
  "ويفرق فيه بين الكبيرة والصغيرة بحسب الدليل لا بحسب العادة",
  "ويعرض الحكم على الكتاب والسنة الصحيحة دون التهوين أو التشديد بلا دليل",
  "ويحذر من الاستهانة به إن كثر في المجتمع",
  "والأثر المطلوب ترك الذنب ظاهرا وباطنا لا مجرد الاستحسان النظري",
];

const FIELDS = ["shortDescription", "explanation"];

/** تُسقط التشكيل والتطويل ليَعْضَّ الحارسُ ولو غُيِّر ضبطُ الحرف */
const bare = (s) =>
  String(s || "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const barePhrases = FILLER_PHRASES.map((p) => ({ raw: p, bare: bare(p) }));
const violations = [];

for (const topic of SINS_TOPICS) {
  for (const field of FIELDS) {
    const raw = topic[field];
    if (!raw) continue;
    const flat = bare(raw);

    for (const p of barePhrases) {
      if (flat.includes(p.bare)) {
        violations.push(`${topic.slug} :: ${field} :: جملة قالبية « ${p.raw} »`);
      }
    }

    const dots = raw.match(/\.{3,}|…{2,}/g);
    if (dots) {
      violations.push(
        `${topic.slug} :: ${field} :: سلسلة نقاط عمياء (${dots[0].length} نقطة)`,
      );
    }
  }
}

/** الكاشف العام: جملةٌ تتكرر حرفيًا في ثلاثة موضوعات فأكثر ⇒ قالب لا وصفٌ لموضوعها */
const sentenceOwners = new Map();
for (const topic of SINS_TOPICS) {
  const seenHere = new Set();
  for (const field of FIELDS) {
    for (const piece of String(topic[field] || "").split(/[.؛]+/)) {
      const s = bare(piece);
      if (s.split(" ").length < 4) continue;
      seenHere.add(s);
    }
  }
  for (const s of seenHere) {
    if (!sentenceOwners.has(s)) sentenceOwners.set(s, new Set());
    sentenceOwners.get(s).add(topic.slug);
  }
}
for (const [s, owners] of sentenceOwners) {
  if (owners.size >= 3) {
    violations.push(
      `جملة مشتركة بين ${owners.size} موضوعات (${[...owners].slice(0, 3).join("، ")}…) :: « ${s.slice(0, 70)} »`,
    );
  }
}

/** روابط الموضوعات المتصلة: getRelatedTopics يُسقط المعرِّف الميت صامتًا فلا يظهر عيبُه للزائر */
const slugs = new Set(SINS_TOPICS.map((t) => t.slug));
for (const topic of SINS_TOPICS) {
  for (const rel of topic.relatedSlugs) {
    if (!slugs.has(rel)) {
      violations.push(`${topic.slug} :: relatedSlugs يشير إلى موضوع غير موجود « ${rel} »`);
    }
  }
}

/** مصدرا التصنيف يجب أن يتطابقا: القائمة تُبنى بـrightsCategory وشارةُ «قيد الإعداد» بـtopicSlugs */
for (const cat of SINS_CATEGORIES) {
  const byCategory = SINS_TOPICS.filter((t) => t.rightsCategory === cat.rightsCategory).map(
    (t) => t.slug,
  );
  const missing = cat.topicSlugs.filter((s) => !byCategory.includes(s));
  const extra = byCategory.filter((s) => !cat.topicSlugs.includes(s));
  if (missing.length || extra.length) {
    violations.push(
      `تصنيف ${cat.id} :: topicSlugs يخالف rightsCategory` +
        (missing.length ? ` — في القائمة ولا يظهر: ${missing.join("، ")}` : "") +
        (extra.length ? ` — يظهر وليس في القائمة: ${extra.join("، ")}` : ""),
    );
  }
}

console.log(
  `الموضوعات: ${SINS_TOPICS.length} | الحقول المفحوصة: ${SINS_TOPICS.length * FIELDS.length} | مخالفات: ${violations.length}\n`,
);
violations.slice(0, 200).forEach((v) => console.log("✗ " + v));
if (violations.length > 200) console.log(`… و${violations.length - 200} أخرى`);

if (violations.length) {
  console.error(
    `\n✗ حارس «الذنوب والحقوق»: ${violations.length} مخالفة في بيانات تبلغ الزائر.` +
      `\n  الحقلُ المعروض يخصُّ موضوعَه؛ والجملةُ القالبية تُخبر عنه بما ليس فيه ⇒ تُحذف لا تُعمَّم.`,
  );
  process.exit(1);
}
console.log(
  "✓ حارس «الذنوب والحقوق»: لا جملةَ قالبية ولا نقاطَ عمياء، والروابط والتصنيفات متسقة.",
);
