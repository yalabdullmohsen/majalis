#!/usr/bin/env node
/**
 * strip-enrichment-boilerplate.mjs
 * يزيل الحشو الآلي من أوصاف الصفحات ونصوص الأدلة (آية/حديث) في src/views،
 * ومن حقول الملخّص في بذور src/lib المعروفة (ج-٣٧٥).
 *
 * أوضاع:
 *   --apply       يكتب التعديلات
 *   --report      يبلّغ عن الأوصاف المكررة حرفيًا (بدون كتابة)
 *   --limit N     يقصر تنظيف البذور على أوّل N حقلًا (لتحجيم الدفعة للمراجعة)
 *   --seeds-only  يقصر العمل على بذور src/lib دون src/views
 *   (افتراضي)     جاف: يعرض الإحصاء فقط
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VIEWS = path.join(ROOT, "src/views");
const APPLY = process.argv.includes("--apply");
const REPORT = process.argv.includes("--report");
const SEEDS_ONLY = process.argv.includes("--seeds-only");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  const n = i === -1 ? NaN : Number(process.argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
})();

/** أنماط الحشو المعروفة (من سكربتات enrich-round*) — تُزال من أي حقل. */
const BOILERPLATE_FRAGMENTS = [
  /محتوى تعليمي معتمد في منهج مجالس العلم[؛.]?\s*يُستفاد في التعلم والتطبيق\s*—\s*مرجع تربوي شرعي/g,
  /محتوى تعليمي معتمد في منهج مجالس العلم/g,
  /يُستفاد في التعلم والتطبيق\s*—\s*مرجع تربوي شرعي/g,
  /يُستفاد في التعلم والتطبيق\s*—\s*مرجع معتمد[^"«»﴾]*?(?=[\.؛,]|$)/g,
  /يُستفاد منه في التعلم والتطبيق[^"«»﴾]*?(?=[\.؛,]|$)/g,
  /مرجع تربوي شرعي/g,
  /مرجع معتمد في مجالس العلم/g,
  /مرجع مجالس العلم/g,
  /من أصول العقيدة الإسلامية على منهج السلف/g,
  /يُقرأ ضمن مسار العقيدة للمبتدئ ثم المتوسط[^"«»﴾]*/g,
  /يُقرأ ضمن مسار المبتدئ ثم المتوسط[^"«»﴾]*/g,
  /من أدلة أركان الإسلام[؛,]?\s*يُستحضر في التعليم[^"«»﴾]*/g,
  /من أدلة أركان الإسلام[؛,]?\s*/g,
  /يُستحضر في التعليم[^"«»﴾]*/g,
  /مادة تعليمية على منهج أهل السنة، مع التزام التثبت من الأدلة وعدم بناء العقيدة على ما لم يثبت\.?\s*/g,
  /من أبواب الفقه وأحكامه عند أهل العلم[؛,]?\s*/g,
  /من علوم القرآن المعتمدة عند أهل السنة[^"«»﴾]*/g,
  /من علوم القرآن الكريم وأدواته[؛,]?\s*/g,
  /من حقائق علوم القرآن الأساسية[^"«»﴾]*/g,
  /رواية ضعيفة لا تُعد حجةً ثابتة؛ يُستغنى بما ثبت في الصحيح\s*—\s*سياسة مجالس العلم\.?/g,
  /—\s*مرجع معتمد[^"«»﴾]*$/g,
  /—\s*مرجع م[^"«»﴾]*$/g,
  /—\s*مرجع[^"«»﴾]*$/g,
];

const TRAILING_DOTS = /\.{4,}/g;
const TRAILING_JUNK = /[؛,\s—\-]+$/;

/**
 * حشو بذور src/lib — عباراتٌ ثابتة وَلَّدَتها سكربتات enrich-round* لبلوغ حدٍّ
 * أدنى للطول (UPDATE_SUMMARY_MIN = 380)، ثمّ أكملت النقص بنقاطٍ حرفية. الحدُّ
 * نفسه أُبطل لاحقًا في تلك السكربتات (padToNeed ترمي «content-padding banned»)،
 * لكنّ ما كُتب في البذور قبل الإبطال بقي منشورًا في الواجهة.
 */
const SEED_BOILERPLATE = [
  /\s*؛?\s*ويربط التحديث بمصدره المعتمد في المنصة للمتابعة والاطلاع/g,
  /\s*؛?\s*يُستفاد منه في متابعة تطورات المنصة والمحتوى/g,
  /\s*؛?\s*مع الرجوع للتفاصيل الكاملة في صفحة التحديثات/g,
  /\s*؛?\s*يُعرض للمستخدم بصيغة موجزة للاطلاع السريع/g,
  /\s*مع بيان نوع التحديث ومصدره المعتمد في المنصة/g,
  /\s*للعِلم والمتابعة لا بديلاً عن الرجوع للأصل/g,
  /\s*ويُراجع عبر الرابط المصدر للتفاصيل الكاملة/g,
];

/** البذور المشمولة: الملفّ، والحقل، وأنماط حشوه. */
const SEED_TARGETS = [
  { file: "src/lib/updates-seed.ts", field: "summary", fragments: SEED_BOILERPLATE },
];

function cleanString(raw, { maxLen = null, evidence = false } = {}) {
  let s = String(raw);
  for (const re of BOILERPLATE_FRAGMENTS) {
    s = s.replace(re, "");
  }
  s = s.replace(TRAILING_DOTS, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(TRAILING_JUNK, "").trim();
  // فواصل منقوطة مزدوجة بعد الحذف
  s = s.replace(/[؛,]{2,}/g, "؛").replace(/\s*[؛,]\s*$/g, "").trim();

  if (evidence) {
    // للأدلة: أزل أي ذيل يبدأ بفاصلة عربية أو شرطة بعد المتن
    const cutters = [
      /[؛.]\s*من\s+.+$/,
      /[؛.]\s*يُقرأ.+$/,
      /[؛.]\s*يُستحضر.+$/,
      /[؛.]\s*محتوى.+$/,
      /\s+من أدلة.+$/,
      /\s+من أصول.+$/,
    ];
    for (const re of cutters) s = s.replace(re, "").trim();
    s = s.replace(TRAILING_JUNK, "").trim();
    return s;
  }

  if (maxLen && s.length > maxLen) {
    // قص عند أقرب فاصل قبل الحد
    const slice = s.slice(0, maxLen);
    const cut = Math.max(slice.lastIndexOf("۔"), slice.lastIndexOf("."), slice.lastIndexOf("،"), slice.lastIndexOf("؛"), slice.lastIndexOf(" "));
    s = (cut > 40 ? slice.slice(0, cut) : slice).trim().replace(TRAILING_JUNK, "");
  }
  return s;
}

/**
 * ينظّف قيم النص داخل مفاتيح محددة في الملف (وصف عام أو أدلة).
 * يتعامل مع سلاسل JS مزدوجة الاقتباس فقط (نمط الملفات الحالية).
 */
function processFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const original = src;
  let changes = 0;

  // 1) حقول أدلة: text: "..." داخل dalilQuran / dalilHadith / scholarQuote
  src = src.replace(
    /(\b(?:dalilQuran|dalilHadith)\s*:\s*\[[\s\S]*?\])/g,
    (block) =>
      block.replace(/(\btext\s*:\s*")((?:\\.|[^"\\])*)(")/g, (_, a, body, c) => {
        const cleaned = cleanString(body, { evidence: true });
        if (cleaned !== body) changes++;
        return a + cleaned.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + c;
      }),
  );

  src = src.replace(
    /(\bscholarQuote\s*:\s*\{\s*text\s*:\s*")((?:\\.|[^"\\])*)(")/g,
    (_, a, body, c) => {
      const cleaned = cleanString(body, { evidence: true });
      if (cleaned !== body) changes++;
      return a + cleaned.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + c;
    },
  );

  // 2) أوصاف عامة: desc / description / summary / meaning / body في السلاسل الطويلة المحشوة
  src = src.replace(
    /(\b(?:desc|description|summary|meaning)\s*:\s*")((?:\\.|[^"\\])*)(")/g,
    (_, a, body, c) => {
      if (!/محتوى تعليمي|مرجع تربوي|منهج السلف|يُستفاد|يُقرأ ضمن|\.{5,}/.test(body)) {
        return a + body + c;
      }
      const cleaned = cleanString(body, { maxLen: 140 });
      if (cleaned !== body) changes++;
      return a + cleaned.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + c;
    },
  );

  if (changes > 0 && APPLY) {
    fs.writeFileSync(filePath, src, "utf8");
  }
  return { file: path.relative(ROOT, filePath), changes, wrote: APPLY && changes > 0, src: APPLY ? undefined : src, dirty: original !== src };
}

/**
 * ينظّف حقلًا واحدًا في ملفّ بذور: يزيل الحشو الثابت وذيل النقاط، ثمّ يعيد
 * علامة الختام. لا قصّ بطول أقصى — متن التحديث الأصيل قد يبلغ 340 محرفًا.
 */
function processSeedFile(target, budget) {
  const filePath = path.join(ROOT, target.file);
  let src = fs.readFileSync(filePath, "utf8");
  let changes = 0;
  const samples = [];

  const re = new RegExp(`(\\b${target.field}\\s*:\\s*")((?:\\\\.|[^"\\\\])*)(")`, "g");
  src = src.replace(re, (whole, a, body, c) => {
    if (changes >= budget) return whole;
    let s = body;
    for (const frag of target.fragments) s = s.replace(frag, "");
    s = s.replace(TRAILING_DOTS, "");
    s = s.replace(/\s{2,}/g, " ").trim();
    s = s.replace(TRAILING_JUNK, "").trim();
    if (s && !/[.!؟»]$/.test(s)) s += ".";
    if (s === body) return whole;
    changes++;
    samples.push({ before: body.length, after: s.length });
    return a + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + c;
  });

  if (changes > 0 && APPLY) fs.writeFileSync(filePath, src, "utf8");
  return { file: target.file, field: target.field, changes, samples };
}

function walkTsx(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkTsx(p));
    else if (ent.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function collectDescs(files) {
  const map = new Map(); // text -> [files]
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const re = /\b(?:desc|description)\s*:\s*"((?:\\.|[^"\\])*)"/g;
    let m;
    while ((m = re.exec(src))) {
      const t = m[1].trim();
      if (t.length < 20) continue;
      if (!map.has(t)) map.set(t, []);
      map.get(t).push(path.relative(ROOT, f));
    }
  }
  return [...map.entries()].filter(([, files]) => files.length > 1);
}

const files = walkTsx(VIEWS);
const priority = [
  "ArkanIslamPage.tsx",
  "ArkanImanPage.tsx",
  "TawhidPage.tsx",
  "FiqhPage.tsx",
];
const ordered = [
  ...files.filter((f) => priority.some((p) => f.endsWith(p))),
  ...files.filter((f) => !priority.some((p) => f.endsWith(p))),
];

let totalChanges = 0;
let filesTouched = 0;
for (const f of SEEDS_ONLY ? [] : ordered) {
  const r = processFile(f);
  if (r.changes > 0) {
    filesTouched++;
    totalChanges += r.changes;
    console.log(`${r.wrote ? "✓ كتب" : "· جاف"} ${r.file}: ${r.changes} حقل`);
  }
}

console.log(`\nالإجمالي (src/views): ${totalChanges} حقل في ${filesTouched} ملفًا ${APPLY ? "(طُبِّق)" : "(جاف — مرّر --apply للكتابة)"}`);

let seedBudget = LIMIT;
for (const target of SEED_TARGETS) {
  const r = processSeedFile(target, seedBudget);
  seedBudget -= r.changes;
  const saved = r.samples.reduce((a, s) => a + (s.before - s.after), 0);
  console.log(
    `${APPLY && r.changes > 0 ? "✓ كتب" : "· جاف"} ${r.file} [${r.field}]: ${r.changes} حقل، ${saved} محرف حشو مُزال` +
      (LIMIT === Infinity ? "" : ` (سقف الدفعة ${LIMIT})`),
  );
}

if (REPORT || APPLY) {
  const dups = collectDescs(files);
  console.log(`\nأوصاف مكررة حرفيًا (${dups.length}):`);
  for (const [text, locs] of dups.slice(0, 40)) {
    console.log(`  [${locs.length}×] ${text.slice(0, 80)}…`);
    console.log(`       → ${[...new Set(locs)].join(", ")}`);
  }
  if (dups.length > 40) console.log(`  … و${dups.length - 40} أخرى`);
}

if (!APPLY && totalChanges > 0) process.exitCode = 0;
