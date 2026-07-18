#!/usr/bin/env node
/**
 * verify-font-consistency.mjs
 *
 * يمنع رجوع أي خط غير Almarai ليصبح الخط الأساسي لواجهة المنصة (2026-07-18،
 * تحديثًا لسياسة IBM Plex Sans Arabic السابقة بتاريخ 2026-07-16).
 * يفحص كل font-family/fontFamily في src/ وlib/ ويرفض أي قيمة أولى ليست:
 *   - "Almarai" / "IBM Plex Sans Arabic" (بديل احتياطي، ولا يزال يُستخدَم صراحةً
 *     في مسارات توليد الصور/PDF التي لا تقرأ متغيّرات CSS) / "Noto Sans Arabic" /
 *     system-ui / -apple-system / sans-serif
 *   - var(--font-...) أو var(--mj-font-...) (تُحلّ جميعها إلى Almarai ما عدا --font-quran)
 *   - inherit
 *   - مكدّس monospace (كود/أرقام)
 *   - أحد خطوط الاستثناء القرآني/التراثي المعتمدة صراحةً (انظر QURAN_EXCEPTION_FONTS)
 *
 * Run: node scripts/verify-font-consistency.mjs
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;

// خطوط الاستثناء الوحيدة المسموح بها كقيمة أولى — الرسم القرآني العثماني
// وما يتبعه مباشرة من نصوص تراثية (بالاسم الصريح المُدقَّق يدويًا، وليس أي
// نص يستخدم الخط لأسباب زخرفية فقط — راجع تقرير 2026-07-13).
const QURAN_EXCEPTION_FONTS = [
  "amiri quran", "amiri", "scheherazade", "kfgqpc", "uthmanic", "hafs",
  "aref ruqaa", "noto naskh arabic",
];

const MONOSPACE_MARKERS = [
  "monospace", "ui-monospace", "sf mono", "menlo", "consolas",
  "courier", "courier new", "roboto mono", "source code pro",
];

const FONT_FAMILY_RE = /font-family\s*[:=]\s*["'`]?([^;"'`\n)]+)/gi;

function firstToken(value) {
  return value
    .split(",")[0]
    .replace(/!important/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
}

const UI_FONT_MARKERS = [
  "almarai", "ibm plex sans arabic", "noto sans arabic", "system-ui", "-apple-system", "sans-serif",
];

function isAllowed(rawValue) {
  const value = rawValue.trim();
  if (/^var\(\s*--(mj-)?font-/i.test(value)) return true; // تُحلّ عبر :root إلى IBM Plex Sans Arabic (أو --font-quran المعتمد)
  const first = firstToken(value);
  if (first === "inherit" || first === "") return true;
  if (UI_FONT_MARKERS.includes(first)) return true;
  if (MONOSPACE_MARKERS.includes(first)) return true;
  if (QURAN_EXCEPTION_FONTS.includes(first)) return true;
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
  console.error("\x1b[31m✗ فحص اتساق الخط فشل — عُثر على خط غير Almarai:\x1b[0m\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  →  font-family: ${v.value}`);
  }
  console.error(
    "\n\x1b[33mالخط الموحَّد للمنصة هو Almarai. إن كان هذا استثناءً قرآنيًا/تراثيًا حقيقيًا،" +
    " أضف اسم الخط إلى QURAN_EXCEPTION_FONTS في scripts/verify-font-consistency.mjs بعد تدقيق يدوي" +
    " يؤكد أن العنصر يعرض نصًا قرآنيًا حرفيًا لا نصًا زخرفيًا مستعارًا.\x1b[0m\n"
  );
  process.exit(1);
} else {
  console.log(`\x1b[32m✓ فحص اتساق الخط: لا انحراف عن Almarai (${listFiles().length} ملف مفحوص)\x1b[0m`);
}
