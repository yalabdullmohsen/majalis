#!/usr/bin/env node
/**
 * يستبدل الخلاصة العملية القالبية («اعمل في باب …») بنص مشتق من
 * preferred / ruling / definition الموجود أصلًا — بلا اختراع حكم جديد.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BOOKS_PATH = resolve(root, "content/fiqh/books.json");
const AUDIT_PATH = resolve(root, "fiqh-content-audit.md");

const TEMPLATE_RE =
  /اعمل في باب .+ بالمعتمد الحنبلي بعد تصور المسألة،\s*واجعل السؤال للعالم عند النوازل الخاصة\.?/u;

function cleanBab(title) {
  return String(title || "")
    .replace(/^باب\s+/u, "")
    .replace(/^كتاب\s+/u, "")
    .trim();
}

function firstSentence(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const m = t.match(/^(.+?[.。؛])(?:\s|$)/u);
  return (m ? m[1] : t).trim();
}

function clip(text, max = 160) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}

function ensurePeriod(s) {
  const t = String(s || "").trim();
  if (!t) return t;
  return /[.。؟!]$/u.test(t) ? t : `${t}.`;
}

function roleOf(lesson) {
  const id = lesson.id || "";
  const title = lesson.title || "";
  if (id.includes("overview") || title.startsWith("مدخل")) return "overview";
  if (id.includes("masala-3") || title.includes("التنبيه على الراجح")) return "rajih";
  if (id.includes("masala-2") || title.startsWith("مسائل معتمدة")) return "masala";
  if (id.includes("mithal") || title.includes("مثال تطبيقي")) return "mithal";
  if (id.includes("shurut") || title.includes("ضوابط") || title.includes("شروط")) return "shurut";
  return "topic";
}

function rewritePractical(lesson, chapter) {
  const bab = cleanBab(chapter.title);
  const preferred = (lesson.preferred || "").trim();
  const ruling = (lesson.ruling || "").trim();
  const definition = (lesson.definition || "").trim();
  const core = firstSentence(preferred) || firstSentence(ruling) || firstSentence(definition);
  const role = roleOf(lesson);

  if (role === "rajih") {
    return `للتعليم والعمل العام اعتمد قول المذهب في ${bab}؛ ولا تقدّم خلافًا داخليًا بلا مرجّح ظاهر.`;
  }
  if (role === "shurut") {
    return `قبل ترتيب أثر باب ${bab}: راجع الشروط والموانع واحدًا واحدًا، ولا تبنِ على وصف ناقص.`;
  }
  if (role === "overview") {
    const def = clip(firstSentence(definition) || core, 140);
    return ensurePeriod(
      def
        ? `تصوّر الباب أولًا: ${def.replace(/[.。]$/u, "")}. ثم اعمل بالمعتمد، واسأل عند النوازل`
        : `تصوّر مسائل باب ${bab} على المعتمد الحنبلي، واسأل عند النوازل`,
    );
  }
  if (role === "masala") {
    const bit = clip(core, 140);
    return ensurePeriod(
      bit
        ? `حرّر مسائل الباب على المعتمد: ${bit.replace(/[.。]$/u, "")}. وما اشتبه فارفعه لأهل العلم`
        : `حرّر مسائل باب ${bab} على المعتمد، وما اشتبه فارفعه لأهل العلم`,
    );
  }
  if (role === "mithal") {
    const bit = clip(core || preferred, 150);
    return ensurePeriod(
      bit
        ? `طبّق صورة الباب بالمعتمد: ${bit.replace(/[.。]$/u, "")}`
        : `طبّق صورة باب ${bab} بالمعتمد بعد تحرير الوصف`,
    );
  }
  const bit = clip(core || preferred || definition, 150);
  return ensurePeriod(
    bit
      ? `اعمل بالمعتمد: ${bit.replace(/[.。]$/u, "")}. وعند الاشتباه اسأل أهل العلم`
      : `اعمل بمعتمد باب ${bab} بعد تصور المسألة، واسأل عند النوازل`,
  );
}

function isTemplateText(s) {
  return TEMPLATE_RE.test(String(s || ""));
}

const data = JSON.parse(readFileSync(BOOKS_PATH, "utf8"));
let fixedPractical = 0;
let fixedExamples = 0;

for (const book of data.books || []) {
  for (const chapter of book.chapters || []) {
    for (const lesson of chapter.lessons || []) {
      const prac = (lesson.practicalSummary || "").trim();
      if (isTemplateText(prac)) {
        lesson.practicalSummary = rewritePractical(lesson, chapter);
        fixedPractical += 1;
      }
      const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
      if (examples.some((e) => isTemplateText(e) || /تطبيق عملي:\s*اعمل في باب/u.test(e))) {
        const ps = (lesson.practicalSummary || "").trim();
        lesson.examples = ps ? [`تطبيق عملي: ${ps}`] : [];
        fixedExamples += 1;
      }
    }
  }
}

writeFileSync(BOOKS_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
let audit = "";
try {
  audit = readFileSync(AUDIT_PATH, "utf8");
} catch {
  audit = "# تدقيق محتوى الفقه\n";
}
const note = [
  "",
  `## جولة إزالة الحشو القالبي (${now})`,
  "",
  `- استُبدلت خلاصات عملية قالب «اعمل في باب…»: ${fixedPractical}`,
  `- حُدّثت أمثلة تطبيقية قالبّية: ${fixedExamples}`,
  "- المصدر: اشتقاق من preferred/ruling/definition الموجودة — بلا حكم جديد.",
  "",
].join("\n");
writeFileSync(AUDIT_PATH, `${audit.trimEnd()}\n${note}`, "utf8");

console.log(
  JSON.stringify(
    { fixedPractical, fixedExamples, remaining: 0 },
    null,
    2,
  ),
);
