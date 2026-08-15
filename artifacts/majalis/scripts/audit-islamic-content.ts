#!/usr/bin/env node
/**
 * تدقيق محتوى إسلامي حسّاس — حشو / تزكيات مطلقة / تنبيهات كتب / أزهر اعتماد
 * لا يفشل على سياقات منضبطة؛ يفشل فقط عند صيغ مثبتة ممنوعة أو غياب تنبيه مطلوب.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const notes: string[] = [];
const fail = (m: string) => errors.push(m);
const note = (m: string) => notes.push(m);

function walk(dir: string, pred: (n: string, p: string) => boolean, out: string[] = []): string[] {
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

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

// 1) حشو الأنبياء
const FILLER = [
  "تُربط سيرته",
  "يُستحضر المآل",
  "الصبر على مقتضاه",
  "العبرة بما ثبت في الوحي",
  "مع اجتناب الغلو والإسرائيليات",
  "ويُسأل الله التوفيق للعمل",
  "دون التوسع في روايات غير محررة",
];
const prophetData = read("src/lib/prophets-data.ts");
for (const ph of FILLER) {
  if (prophetData.includes(ph)) fail(`حشو أنبياء في prophets-data.ts: «${ph}»`);
}
for (const f of walk(path.join(root, "seo-prerender/prophets"), (n) => n === "index.html")) {
  const html = fs.readFileSync(f, "utf8");
  for (const ph of FILLER) {
    if (html.includes(ph)) fail(`${path.relative(root, f)}: حشو «${ph}»`);
  }
}

// 2) تزكيات مطلقة ممنوعة
const ABSOLUTE = ["فيلسوف الإسلام الأكبر", "أعظم شروح صحيح البخاري وأكملها", "الإمام المطلق", "معتمد في تدريس المنطق بالأزهر", "مآذن الأزهر"];
for (const file of walk(path.join(root, "src"), (n) => /\.(ts|tsx|json)$/.test(n))) {
  if (file.includes("__tests__")) continue;
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const ph of ABSOLUTE) {
    if (text.includes(ph)) fail(`${rel}: عبارة ممنوعة «${ph}»`);
  }
}

// 3) حجة الإسلام — مسموح بتحفّظ أو مصطلح الحج
const scholars = read("src/lib/scholars-data.ts");
if (/حجة الإسلام/.test(scholars) && !/اشتهر عند بعض أهل العلم بلقب|لقب «حجة الإسلام»/.test(scholars)) {
  // قد تكون مواضع أخرى؛ تحقق الغزالي تحديداً
  const ghazaliBlock = scholars.match(/id:\s*["']ghazali["'][\s\S]{0,1200}/);
  if (ghazaliBlock && /حجة الإسلام/.test(ghazaliBlock[0]) && !/اشتهر عند بعض|لقب «حجة الإسلام»/.test(ghazaliBlock[0])) {
    fail("ghazali: حجة الإسلام بلا تحفّظ");
  } else {
    note("حجة الإسلام موجودة بسياق منضبط أو خارج كتلة الغزالي — لا فشل");
  }
}

// 4) كتب حساسة يجب أن تحمل caution
const { LIBRARY_CATALOG } = await import(pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href);
const { SCHOLARS } = await import(pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href);
for (const id of ["book-ihya", "book-shifa-qadi-iyad", "book-sirah-halabiyya", "book-razi-tafsir", "book-tarikh-tabari"]) {
  const b = (LIBRARY_CATALOG as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
  if (!b?.caution || !b.contentStatus) fail(`كتاب ${id} بلا caution/contentStatus`);
}
for (const id of ["ghazali", "ibn-rushd", "fakhr-razi", "qadi-iyad"]) {
  const s = (SCHOLARS as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
  if (!s?.caution || !s.contentStatus) fail(`عالم ${id} بلا caution/contentStatus`);
}

// 5) واجهة داخل مقالات الأنبياء المصدر
const prophetSrc = read("src/views/ProphetStoriesPage.tsx");
if (/<article[\s\S]{0,12000}Esc للقائمة/.test(prophetSrc) || /<article[\s\S]{0,12000}اختصارات:/.test(prophetSrc)) {
  fail("ProphetStoriesPage: اختصارات داخل article");
}
if (!/aria-label=["']تنقل قصص الأنبياء["']/.test(prophetSrc)) {
  fail("ProphetStoriesPage: nav تنقل قصص الأنبياء مفقود");
}

console.log(JSON.stringify({ notes: notes.length, errors: errors.length, notesSample: notes.slice(0, 5) }, null, 2));
if (errors.length) {
  console.error(`audit:islamic-content FAILED\n- ${errors.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
console.log("audit:islamic-content OK");
