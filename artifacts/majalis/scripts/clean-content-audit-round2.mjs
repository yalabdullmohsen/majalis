#!/usr/bin/env node
/**
 * تنظيف حشو FAQ اكتشف الإسلام + أوصاف المؤسسات المقطوعة (2026-08-25).
 * لا يغيّر review_status إلى verified — المراجعة البشرية تبقى مطلوبة.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** يحذف الذيل القالبي المتكرر بعد جواب FAQ */
function cleanFaqBody(body) {
  let out = String(body || "");
  // احذف من «جواب موجز…» حتى نهاية القوالب المتكررة، مع الإبقاء على السؤال والجواب
  out = out.replace(
    /\n*جواب موجز لحديث العهد[\s\S]*$/m,
    "",
  );
  // إن بقي قسم ضابط بعد القطع الجزئي
  out = out.replace(/\n*## أسلوب الجواب[\s\S]*$/m, "");
  out = out.replace(/\n*## إن لم يقتنع السائل[\s\S]*$/m, "");
  out = out.replace(/\n*## ضابط للمعلّم والداعية[\s\S]*$/m, "");
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  if (!out.endsWith("\n")) out += "\n";
  return out;
}

const faqPath = path.join(ROOT, "public/data/knowledge/discover-islam/path-and-faq.json");
const faq = JSON.parse(readFileSync(faqPath, "utf-8"));
let faqCleaned = 0;
for (const item of faq.items || []) {
  const before = item.body;
  const after = cleanFaqBody(before);
  if (after !== before) {
    item.body = after;
    faqCleaned++;
  }
}
faq.updated_at = new Date().toISOString().slice(0, 10);
writeFileSync(faqPath, JSON.stringify(faq, null, 2) + "\n", "utf-8");
console.log(`✓ discover FAQ: نظّف ${faqCleaned} عنصرًا`);

/** أوصاف صفحات UI المقطوعة/المكررة — إصلاحات حرفية آمنة */
const SEO_FIXES = [
  {
    file: "src/views/SahabahPage.tsx",
    from: 'description: "موسوعة كبار الصحابة رضي الله عنهم؛ سيرتهم وفضائلهم وإرثهم في الإسلام؛ موسوعة كبار الصحابة رضي الله عنهم — : سيرتهم وفضائلهم وإرثهم في"',
    to: 'description: "موسوعة كبار الصحابة رضي الله عنهم: سيرتهم وفضائلهم وإرثهم في الإسلام، مع ترتيب بالتصنيفات والبحث."',
  },
  {
    file: "src/views/ProphetStoriesPage.tsx",
    from: 'description: "قصص ٢٥ نبياً ورسولاً مذكورين في القرآن الكريم، سِيَرهم ومعجزاتهم وأقوامهم والدروس المستفادة، مع خط زمني ومقارنة وأولو العزم. محتوى معتمد في"',
    to: 'description: "قصص ٢٥ نبياً ورسولاً مذكورين في القرآن الكريم: سيرهم ومعجزاتهم وأقوامهم والدروس المستفادة، مع خط زمني ومقارنة وأولو العزم."',
  },
  {
    file: "src/views/ArkanIslamPage.tsx",
    from: 'description: "شرح تفصيلي لأركان الإسلام الخمسة: الشهادتان، الصلاة، الزكاة، الصوم، الحج، مع الأدلة وأقوال العلماء. مع الأدلة من القرآن والسنة وأقوال"',
    to: 'description: "شرح تفصيلي لأركان الإسلام الخمسة: الشهادتان والصلاة والزكاة والصوم والحج، مع الأدلة من القرآن والسنة وأقوال العلماء."',
  },
  {
    file: "src/views/RaqaiqPage.tsx",
    from: 'description: "مواعظ الرقائق والزهد من الكتاب والسنة وأقوال السلف، لتليين القلوب واستحضار الآخرة. لتليين القلوب واستحضار الآخرة من الكتاب والسنة وأقوال"',
    to: 'description: "مواعظ الرقائق والزهد من الكتاب والسنة وأقوال السلف، لتليين القلوب واستحضار الآخرة."',
  },
  {
    file: "src/views/MiraclesPage.tsx",
    from: 'description: "موضوعات تُعرض بحذر للتأمل في دلائل الآيات الكونية عند ثبوت المعنى؛ المعتمد في منهج الموقع: الإعجاز البياني والغيبي والتشريعي — لا إعجاز"',
    to: 'description: "موضوعات تُعرض بحذر للتأمل في دلائل الآيات الكونية عند ثبوت المعنى؛ منهج الموقع: الإعجاز البياني والغيبي والتشريعي لا الإعجاز العلمي المطلق."',
  },
  {
    file: "src/views/JannaNaarPage.tsx",
    from: 'description: "صفة الجنة وأبوابها وأنهارها ودرجاتها ونعيمها مع الإحالة إلى الأدلة والتفصيل في الأقسام التالية لمن أراد التوسع والتثبت. — دليل عملي منظم"',
    to: 'description: "صفة الجنة وأبوابها وأنهارها ودرجاتها ونعيمها من الأدلة الصحيحة، مع بيان أسباب دخولها وأدعية الاستعداد للآخرة."',
  },
  {
    file: "src/views/IslamicStoriesPage.tsx",
    from: 'description: "قصص الصحابة الكرام والفتوحات الإسلامية والأحداث التاريخية، من الهجرة النبوية إلى فتح مكة وما بعدها من عصور الإسلام. محتوى معتمد في منهج"',
    to: 'description: "قصص الصحابة الكرام والفتوحات الإسلامية والأحداث التاريخية، من الهجرة النبوية إلى فتح مكة وما بعدها من عصور الإسلام."',
  },
  {
    file: "src/views/IslamicSectsPage.tsx",
    from: 'description: "موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية: نشأة كل فرقة وأصولها العقدية وأبرز علمائها وكتبها وانتشارها؛ مع بيان أصول كل فرقة"',
    to: 'description: "موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية: نشأة كل فرقة وأصولها العقدية وأبرز علمائها وكتبها وانتشارها."',
  },
  {
    file: "src/views/UniversitiesPage.tsx",
    from: 'description: "دليل شامل للجامعات والمعاهد الإسلامية حول العالم، ابحث وقارن بين الجامعات حسب التخصص والمستوى وطريقة الدراسة. محتوى معتمد في منهج مجالس"',
    to: 'description: "دليل الجامعات والمعاهد الإسلامية حول العالم: ابحث وقارن حسب التخصص والمستوى وطريقة الدراسة."',
  },
  {
    file: "src/views/ArbaeenLovePage.tsx",
    from: 'description: "مجموعة أحاديث نبوية موثقة في محبة الله لعباده ومحبة العبد لربه، من صحيح البخاري ومسلم وغيرهما — مراجَعة علميًا قبل النشر. محتوى معتمد في"',
    to: 'description: "أحاديث نبوية موثقة في محبة الله لعباده ومحبة العبد لربه، من صحيح البخاري ومسلم وغيرهما."',
  },
];

let seoFixed = 0;
for (const fix of SEO_FIXES) {
  const abs = path.join(ROOT, fix.file);
  let src = readFileSync(abs, "utf-8");
  if (!src.includes(fix.from)) {
    console.warn(`⚠ لم يُعثر على النص في ${fix.file}`);
    continue;
  }
  src = src.replace(fix.from, fix.to);
  writeFileSync(abs, src, "utf-8");
  seoFixed++;
}
console.log(`✓ SEO: أصلح ${seoFixed} وصفًا`);

/** مؤسسات: إزالة ذيل «من أبرز المؤسسات…» */
const instPath = path.join(ROOT, "src/views/InstitutionsPage.tsx");
let inst = readFileSync(instPath, "utf-8");
const beforeInst = inst;
inst = inst.replace(
  /\s*من أبرز المؤسسات الإسلامية في العالم[^"]*/g,
  (m) => {
    // أبقِ نقطة إن انتهت الجملة قبل الذيل
    return "";
  },
);
// أصلح نهايات مقطوعة بعد الحذف
inst = inst.replace(/(description: "[^"]*?)\s*"/g, (_m, body) => {
  let b = body.trimEnd();
  if (b.endsWith("— مر؛ من") || b.endsWith("— مر") || b.endsWith("؛ من")) {
    b = b.replace(/\s*—?\s*مر؛?\s*من?$/, "").trimEnd();
  }
  if (b && !/[.!»"]$/.test(b)) b += ".";
  return b + '"';
});
if (inst !== beforeInst) {
  writeFileSync(instPath, inst, "utf-8");
  console.log("✓ InstitutionsPage: أُزيل حشو الأوصاف");
} else {
  console.log("• InstitutionsPage: لا تغيير");
}
