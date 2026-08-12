#!/usr/bin/env node
/**
 * بوابة: لا autoFocus في src/views، ولا .focus() داخل useEffect يفتح الكيبورد
 * بلا تفاعل مستخدم (حقول إدخال/نص).
 *
 * تشغيل: node scripts/verify-no-autofocus-gate.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "__tests__" || ent.name === "node_modules") continue;
      walk(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) out.push(p);
  }
  return out;
}

/** يزيل تعليقات السطر والكتل لتفادي إيجابيات كاذبة من الشرح. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const viewsRoot = join(appRoot, "src/views");
for (const file of walk(viewsRoot)) {
  const raw = readFileSync(file, "utf8");
  const src = stripComments(raw);
  const rel = relative(appRoot, file);
  if (/\bautoFocus\b/.test(src)) {
    issues.push(`${rel}: وُجد autoFocus — احذفه؛ التركيز فقط بنقر المستخدم.`);
  }
}

/** ملفات معروفة كانت تفتح الكيبورد عند التحميل/فتح الشيت. */
const focusHotspots = [
  "src/components/GlobalSearchModal.tsx",
  "src/components/ui/AppBottomSheet.tsx",
  "src/components/quran/JumpPageModal.tsx",
  "src/views/VaultPage.tsx",
  "src/components/AdminSiteEditBar.tsx",
  "src/components/MoreBottomSheet.tsx",
];

{
  const morePath = join(appRoot, "src/components/MoreBottomSheet.tsx");
  if (existsSync(morePath)) {
    const moreSrc = stripComments(readFileSync(morePath, "utf8"));
    if (/initialFocusRef\s*=\s*\{[^}]*search/i.test(moreSrc) || /initialFocusRef=\{searchRef\}/.test(moreSrc)) {
      issues.push("src/components/MoreBottomSheet.tsx: لا تُمرّر initialFocusRef لحقل البحث — الكيبورد يُفتح باللمس فقط.");
    }
  }
}

for (const rel of focusHotspots) {
  const p = join(appRoot, rel);
  if (!existsSync(p)) continue;
  const src = stripComments(readFileSync(p, "utf8"));
  const effectBlocks = src.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[[^\]]*\]\s*\)/g) || [];
  for (const block of effectBlocks) {
    // تركيز حقل إدخال عند الفتح (لا يشمل حصر Tab على first/last بعد ضغط المستخدم).
    if (/(inputRef|textareaRef|editTextareaRef|\bta)\.current\?\.focus\s*\(/.test(block)) {
      issues.push(`${rel}: .focus() على حقل داخل useEffect — يمنع فتح الكيبورد التلقائي.`);
    }
    // النمط القديم: اختيار أول input عند الفتح ثم focus مباشرة.
    if (
      /querySelector(?:All)?<[^>]*>?\s*\(\s*['`][^'`]*\binput\b[^'`]*['`]\s*\)/.test(block) &&
      /focusTarget\?\.focus\s*\(/.test(block)
    ) {
      issues.push(`${rel}: تركيز أول input داخل useEffect عند فتح الشيت.`);
    }
  }
}

if (issues.length) {
  console.error("❌ بوابة لا-تركيز-تلقائي رسبت:\n" + issues.map((i) => `  - ${i}`).join("\n"));
  process.exit(1);
}
console.log("✓ بوابة لا-تركيز-تلقائي: لا autoFocus في views ولا تركيز حقول عند الفتح.");
