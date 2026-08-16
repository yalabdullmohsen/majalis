#!/usr/bin/env node
/**
 * تدقيق جودة المحتوى المنشور — يمنع الحشو، الإيميلات القديمة، ونواقص الأنبياء/المكتبة/الحديث.
 * تشغيل: pnpm run audit:content
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".backup") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

const SKIP_EMAIL = /audit-content-quality|audit-contact-email|strip-lesson-filler/;
const FORBIDDEN_EMAIL = [/info@majlisilm\.com/i, /yalabdullmohsen1@gmail\.com/i];
const ALLOWED = /Majlisilm\.app@gmail\.com/i;

for (const file of walk(root, (n) => /\.(tsx?|jsx?|mjs|json|html|md|css|sql)$/i.test(n))) {
  if (SKIP_EMAIL.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const re of FORBIDDEN_EMAIL) {
    if (re.test(text)) fail(`بريد قديم في ${path.relative(root, file)}`);
  }
}
const siteCfg = fs.readFileSync(path.join(root, "site.config.json"), "utf8");
if (!ALLOWED.test(siteCfg)) fail("site.config.json يجب أن يستخدم Majlisilm.app@gmail.com");

const FORBIDDEN_PHRASES = [
  "تُربط سيرته بمقاصد القرآن",
  "ويُستفاد من قصته في بناء الإيمان والأخلاق",
  "الصبر على مقتضاه من تمام الانتفاع لا مجرد الاستحسان",
  "يُستحضر المآل الأخروي عند تنزيل الفائدة على الواقع",
  "يُسأل الله التوفيق للعمل بما علم لا لمجرد معرفة القصة",
  "يُترجم المعنى إلى طاعة ميسورة بحسب الحال",
  "فيلسوف الإسلام الأكبر",
  "الأزهر الشريف",
  "مآذن الأزهر",
];

const contentScan = walk(path.join(root, "src"), (n, p) => {
  if (!/\.(ts|tsx|json)$/.test(n)) return false;
  if (p.includes("__tests__")) return false;
  return true;
});

for (const file of contentScan) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const phrase of FORBIDDEN_PHRASES) {
    if (text.includes(phrase)) fail(`${rel}: عبارة ممنوعة: ${phrase}`);
  }
  if (/author:\s*"حجة الإسلام|name":\s*"حجة الإسلام أبو/.test(text)) {
    fail(`${rel}: لقب «حجة الإسلام» كمدح مطلق في اسم المؤلف`);
  }
}

const { PROPHETS } = await import(pathToFileURL(path.join(root, "src/lib/prophets-data.ts")).href);
const EXPECTED = [
  "آدم", "إدريس", "نوح", "هود", "صالح", "إبراهيم", "لوط", "إسماعيل", "إسحاق", "يعقوب",
  "يوسف", "أيوب", "شعيب", "موسى", "هارون", "ذو الكفل", "داود", "سليمان", "إلياس", "اليسع",
  "يونس", "زكريا", "يحيى", "عيسى", "محمد",
];
if (PROPHETS.length !== 25) fail(`عدد الأنبياء ${PROPHETS.length} ≠ 25`);
PROPHETS.forEach((p, i) => {
  if (p.arabicName !== EXPECTED[i]) fail(`ترتيب الأنبياء: ${EXPECTED[i]} ≠ ${p.arabicName}`);
  if (p.briefBio.length > 520) fail(`${p.slug}: نبذة طويلة جداً`);
});
const muhammad = PROPHETS.find((p) => p.slug === "muhammad");
if (muhammad && /إسرائيليات/.test(muhammad.briefBio)) fail("محمد ﷺ: لا تستخدم الإسرائيليات آلياً");
if (muhammad && !/تُؤخذ سيرته من القرآن والسنة/.test(muhammad.briefBio)) {
  warn("محمد ﷺ: يُفضّل صياغة أخذ السيرة من القرآن والسنة");
}

const { LIBRARY_CATALOG } = await import(pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href);
const NEED_CAUTION = [/إحياء علوم الدين/, /مفاتيح الغيب/, /الشفا بتعريف/, /السيرة الحلبية|إنسان العيون/];
for (const book of LIBRARY_CATALOG) {
  if (!book.title?.trim()) fail(`كتاب بلا عنوان: ${book.id}`);
  if (NEED_CAUTION.some((re) => re.test(book.title))) {
    if (!book.caution || !book.contentStatus) {
      fail(`مكتبة: «${book.title}» يحتاج contentStatus + caution`);
    }
  }
}

const hadithView = fs.readFileSync(path.join(root, "src/pages/hadith/ui/HadithView.tsx"), "utf8");
if (!/لا يُحتج بالحديث الضعيف/.test(hadithView)) fail("HadithView: يلزم تحذير عن الضعيف");
if (!/لا يُنسب الموضوع/.test(hadithView) && !/بيان وضعه/.test(hadithView)) {
  fail("HadithView: يلزم تحذير عن الموضوع");
}

if (warnings.length) console.log(`تحذيرات:\n- ${warnings.join("\n- ")}\n`);
if (errors.length) {
  console.error(`audit:content FAILED (${errors.length})\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("audit:content OK");
