#!/usr/bin/env node
/**
 * حارس الحشو القالبي في المسائل الفقهية الظاهرة (الفحص 19 — ج-٣٩٧، 2026-08-01).
 *
 * بوابة عرض المسائل هي isPublicIssue: status === "published" و
 * documentation_level === "official_verified" ⇒ 33 مسألة تبلغ الزائر. وحقولها
 * الأربعة كلها معروضة: summary (عنوان فرعي + meta description)، description
 * (المتن)، ruling_summary (قسم «خلاصة الحكم» + بطاقة القائمة + نتائج البحث)،
 * evidence_summary (قسم «الأدلة»).
 *
 * كشف عند إنشائه (ج-٣٩٧) أن هذه الحقول كانت محشوّة بجُمل قالبية مكرَّرة حرفيًا
 * عبر السجلات (أعلاها «ويُضبط النقل بضوابط أهل العلم بلا غلو ولا تهاون»: 227
 * مرة في 64 سجلًّا)، وبسلاسل نقاط عمياء تبلغ 34 نقطة داخل النص الظاهر. وبلغت
 * نسبة الحشو 56%–81% من طول الحقل، فحُذف منها 28654 محرفًا من 131 حقلًا.
 *
 * وخطر الحشو ليس الإطالة وحدها: جُمَله تُخبر عن السجل بما ليس فيه — «وتُعرض
 * بأدلتها وضوابطها دون اختزال مخلّ» و«مع الرجوع للدليل» تُذيَّل بها فتوى لا
 * دليل مسمًّى فيها أصلًا ⇒ فهي دعوى جودةٍ كاذبة لا مجرد زخرفة.
 *
 * الشرط: لا يبلغ الزائرَ حقلٌ فيه جملة قالبية معروفة، ولا سلسلة نقاط (3+)،
 * ولا جملة تتكرر حرفيًا في ثلاثة سجلات ظاهرة فأكثر (كاشف الحشو الجديد).
 *
 * التشغيل: node --import tsx scripts/test-fiqh-issue-filler-guard.mjs
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { FIQH_ISSUES_PUBLISHED_SEED } = await imp("src/lib/fiqh-issues-seed.ts");

/** الجمل القالبية المرصودة في ج-٣٩٧ */
const FILLER_PHRASES = [
  "ويُضبط النقل بضوابط أهل العلم بلا غلو ولا تهاون",
  "والمقصود تقريب الفهم للمسلم المعاصر مع الرجوع للدليل",
  "ولا يُقدَّم المشتهر على الثابت عند التعارض",
  "ويُفرَّق بين ما هو تعبّدي ثابت وما هو تاريخي أو اجتهادي",
  "مع مراعاة الخلاف المعتبر وأقوال المجامع عند الحاجة",
  "مع ضبط المصطلحات وبيان محل النزاع قبل الترجيح",
  "تُعرض بأدلتها وضوابطها دون اختزال مخلّ",
  "ويُفرَّق بين الحكم الكلي وتنزيله على الواقعة",
  "والعمدة فيها الدليل والمصلحة الشرعية المنضبطة",
  "ويُقيَّد بما ذكره أهل العلم من شروط واستثناءات",
  "ويُراجع عند تغيّر صورة المسألة المعاصرة",
  "ويُحال التفصيل إلى بحوث المجامع والمراجع المعتمدة",
  "وتُعرض للعامة بأسلوب ميسّر دون إغفال الدليل",
];

const FIELDS = ["summary", "description", "ruling_summary", "evidence_summary"];

/** تُسقط التشكيل والتطويل ليَعْضَّ الحارسُ ولو غُيِّر ضبط الحرف */
const bare = (s) =>
  String(s || "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const barePhrases = FILLER_PHRASES.map((p) => ({ raw: p, bare: bare(p) }));

/** بوابة العرض نفسها: isPublicIssue في src/lib/fiqh-council-trust.ts */
const visible = (FIQH_ISSUES_PUBLISHED_SEED || []).filter(
  (i) => i.status === "published" && i.documentation_level === "official_verified",
);

const violations = [];

for (const issue of visible) {
  for (const field of FIELDS) {
    const raw = issue[field];
    if (!raw) continue;
    const flat = bare(raw);

    for (const p of barePhrases) {
      if (flat.includes(p.bare)) {
        violations.push(`${issue.slug} :: ${field} :: جملة قالبية « ${p.raw} »`);
      }
    }

    const dots = raw.match(/\.{3,}|…{2,}/g);
    if (dots) {
      violations.push(
        `${issue.slug} :: ${field} :: سلسلة نقاط عمياء (${dots[0].length} نقطة)`,
      );
    }
  }
}

/**
 * كاشف الحشو الجديد: جملة تتكرر حرفيًا في ثلاثة سجلات ظاهرة فأكثر.
 * الجملة الحقيقية تخص مسألتها؛ وما عمَّ ثلاثةَ موضوعاتٍ مختلفة فهو قالب.
 */
const sentenceOwners = new Map();
for (const issue of visible) {
  const seenHere = new Set();
  for (const field of FIELDS) {
    for (const piece of String(issue[field] || "").split(/[.؛]+/)) {
      const s = bare(piece);
      if (s.split(" ").length < 5) continue;
      seenHere.add(s);
    }
  }
  for (const s of seenHere) {
    if (!sentenceOwners.has(s)) sentenceOwners.set(s, new Set());
    sentenceOwners.get(s).add(issue.slug);
  }
}
for (const [s, owners] of sentenceOwners) {
  if (owners.size >= 3) {
    violations.push(
      `جملة مشتركة بين ${owners.size} مسائل (${[...owners].slice(0, 3).join("، ")}…) :: « ${s.slice(0, 70)} »`,
    );
  }
}

console.log(
  `المسائل الظاهرة للزائر: ${visible.length} | الحقول المفحوصة: ${visible.length * FIELDS.length} | مخالفات: ${violations.length}\n`,
);
violations.slice(0, 200).forEach((v) => console.log("✗ " + v));
if (violations.length > 200) console.log(`… و${violations.length - 200} أخرى`);

if (violations.length) {
  console.error(
    `\n✗ حارس الحشو القالبي: ${violations.length} مخالفة في حقول تبلغ الزائر.` +
      `\n  الحقل المعروض يخص مسألته؛ والجملة القالبية تُخبر عن السجل بما ليس فيه ⇒ تُحذف لا تُعمَّم.`,
  );
  process.exit(1);
}
console.log("✓ حارس الحشو القالبي: لا جملة قالبية ولا نقاطَ عمياء في المسائل الظاهرة.");
