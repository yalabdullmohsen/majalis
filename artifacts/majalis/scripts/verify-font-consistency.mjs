#!/usr/bin/env node
/**
 * verify-font-consistency.mjs
 *
 * الخط الموحَّد للواجهة هو --font-app (Amiri / Noto Naskh Arabic) —
 * مرجع فقرات وعناوين بطاقات صفحة التفسير. المصحف (--font-quran / QPC/QCF)
 * مستثنى. الرموز القديمة --font-display/--font-body/--font-sans aliases.
 *
 * Run: node scripts/verify-font-consistency.mjs
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;

const themeCss = readFileSync(ROOT + "src/app/styles/theme.css", "utf8");
if (!/--font-app:\s*"Amiri"/.test(themeCss)) {
  console.error("✗ --font-app يجب أن يُعرَّف في @theme كـ Amiri (مرجع التفسير)");
  process.exit(1);
}
for (const alias of ["--font-display", "--font-body", "--font-sans", "--font-ui", "--mj-ui"]) {
  const re = new RegExp(`${alias}:\\s*var\\(--font-app\\)`);
  if (!re.test(themeCss)) {
    console.error(`✗ ${alias} يجب أن يكون alias لـ --font-app`);
    process.exit(1);
  }
}
const indexHtml = readFileSync(ROOT + "index.html", "utf8");
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(indexHtml)) {
  console.error("✗ أزل Google Fonts من index.html — الخطوط محلية في /fonts/ui/");
  process.exit(1);
}
if (!/\/fonts\/ui\/amiri-400-ar\.woff2/.test(indexHtml)) {
  console.error("✗ index.html يجب أن يحمّل مسبقاً Amiri المحلي كخط واجهة أساسي");
  process.exit(1);
}
const fontsUi = readFileSync(ROOT + "src/styles/fonts-ui.css", "utf8");
if (!/"Amiri"/.test(fontsUi) || !/"Noto Naskh Arabic"/.test(fontsUi)) {
  console.error("✗ fonts-ui.css يجب أن يعرّف Amiri و Noto Naskh محليًا");
  process.exit(1);
}

// خطوط الاستثناء الوحيدة المسموح بها كقيمة أولى — الرسم القرآني العثماني
// وما يتبعه مباشرة من نصوص تراثية (بالاسم الصريح المُدقَّق يدويًا، وليس أي
// نص يستخدم الخط لأسباب زخرفية فقط — راجع تقرير 2026-07-13).
const QURAN_EXCEPTION_FONTS = [
  "amiri quran", "amiri", "scheherazade", "scheherazade new", "kfgqpc", "uthmanic", "hafs",
  "kfgqpc hafs uthmanic",
  "aref ruqaa", "noto naskh arabic",
  "majlisfallback",
  // قياس عرض أسطر QCF V2 في measure-mushaf-line-deviation.mjs (خطوط p{n}.woff2)
  "qpc",
];

const MONOSPACE_MARKERS = [
  "monospace", "ui-monospace", "sf mono", "menlo", "consolas",
  "courier", "courier new", "roboto mono", "source code pro",
];

// الشقُّ الأوَّلُ من البدلِ يلتقطُ `var(--x, <بديل>)` كاملةً حتى آخرِ قوسٍ في السطر،
// لأنَّ المتغيّرَ لا يُحكَمُ عليه باسمِه بل ببديلِه المصرَّح (انظر unwrapVar)؛ والشقُّ
// الثاني هو النمطُ الأصليُّ لسائرِ القيم بلا تغيير.
const FONT_FAMILY_RE = /font-family\s*[:=]\s*(var\([^;\n]*\)|["'`]?[^;"'`\n)]+)/gi;

function firstToken(value) {
  return value
    .split(",")[0]
    .replace(/!important/i, "")
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .toLowerCase();
}

/**
 * `var(--x, <بديل>)` ⇐ `<بديل>`؛ فالمتغيّرُ غيرُ المعروفِ لا يُحكَمُ عليه باسمِه،
 * بل بالبديلِ المصرَّحِ في الموضعِ نفسِه (وهو ما يُعرَض فعلًا إن لم يُضبَط المتغيّر).
 * ويعودُ `null` إن لم تكن القيمةُ `var()` أو لم يكن لها بديل.
 */
function unwrapVar(value) {
  const m = /^var\(\s*(--[\w-]+)\s*,([\s\S]+)\)\s*$/.exec(value.trim());
  return m ? m[2].trim() : null;
}

const UI_FONT_MARKERS = [
  "alexandria", "ibm plex sans arabic", "noto sans arabic", "tajawal",
  "system-ui", "-apple-system", "sans-serif",
];

function isAllowed(rawValue) {
  const value = rawValue.trim();
  // بطاقات الحفظ (/memorize): متغيّرات --fc-* مستقلة (Amiri/Tajawal/Alexandria)
  if (/^var\(\s*--fc-/i.test(value)) return true;
  if (/^var\(\s*--mm-qpc-family\b/i.test(value)) return true; // خط صفحة QPC للمصحف الجديد
  if (/^var\(\s*--font-app\b/i.test(value)) return true;
  if (/^var\(\s*--mj-(face|ui|num)\b/i.test(value)) return true;
  if (/^var\(\s*--(mj-)?font-/i.test(value)) return true; // تُحلّ عبر :root إلى IBM Plex Sans Arabic (أو --font-quran المعتمد)
  const fallback = unwrapVar(value);
  if (fallback) return isAllowed(fallback); // يُحكَمُ على البديلِ المصرَّحِ لا على اسمِ المتغيّر
  const first = firstToken(value);
  if (first === "inherit" || first === "") return true;
  if (UI_FONT_MARKERS.includes(first)) return true;
  if (MONOSPACE_MARKERS.includes(first)) return true;
  if (QURAN_EXCEPTION_FONTS.includes(first)) return true;
  if (first.startsWith("qpc")) return true;
  return false;
}

// ملفات مستثناة كليًا من الفحص (سكربتات بناء توليدية تحتاج مراجعة يدوية منفصلة)
const FILE_EXCLUDES = [
  "scripts/verify-font-consistency.mjs",
];

function listFiles() {
  const patterns = [
    "src/**/*.css",
    "src/**/*.ts",
    "src/**/*.tsx",
    "lib/**/*.js",
    "lib/**/*.mjs",
    "scripts/**/*.mjs",
  ];
  const files = new Set();
  for (const pattern of patterns) {
    for (const f of globSync(pattern, { cwd: ROOT })) {
      if (!FILE_EXCLUDES.includes(f)) files.add(f);
    }
  }
  return [...files].sort();
}

let violations = [];

for (const relPath of listFiles()) {
  const abs = ROOT + relPath;
  let content;
  try {
    content = readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    FONT_FAMILY_RE.lastIndex = 0;
    let m;
    while ((m = FONT_FAMILY_RE.exec(line))) {
      const value = m[1];
      if (!isAllowed(value)) {
        violations.push({ file: relPath, line: i + 1, value: value.trim() });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("\x1b[31m✗ فحص اتساق الخط فشل — عُثر على خط خارج --font-app / استثناء المصحف:\x1b[0m\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  →  font-family: ${v.value}`);
  }
  console.error(
    "\n\x1b[33mالخط الموحَّد للمنصة هو --font-app (Amiri). إن كان هذا استثناءً قرآنيًا/تراثيًا حقيقيًا،" +
    " أضف اسم الخط إلى QURAN_EXCEPTION_FONTS في scripts/verify-font-consistency.mjs بعد تدقيق يدوي" +
    " يؤكد أن العنصر يعرض نصًا قرآنيًا حرفيًا لا نصًا زخرفيًا مستعارًا.\x1b[0m\n"
  );
  process.exit(1);
} else {
  console.log(`\x1b[32m✓ فحص اتساق الخط: --font-app (Amiri) بلا انحراف (${listFiles().length} ملف مفحوص)\x1b[0m`);
}
