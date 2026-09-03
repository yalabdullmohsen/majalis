#!/usr/bin/env node
/**
 * فحص جودة النصوص الظاهرة للمستخدم — عبارات ركيكة، أزرار طويلة، فراغ بلا توضيح.
 *
 * Usage:
 *   node scripts/check-copy-quality.js
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN = [
  "حديث تنبيه الحديث",
  "الدرجة في حقل الحكم",
  "قيد الإضافة",
  "المجلس العلمي",
  "Majlisilm",
  "majlisilm",
];

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "seo-prerender",
  "__tests__",
  "admin",
]);

const SKIP_FILES = [
  "content-display-zones.ts",
  "ui-copy.ts",
  "library-catalog.ts",
  "demo-seed.ts",
  "updates-seed.ts",
  "fawaid-curated-seed.ts",
  "smart-cache-eviction.ts",
  "site-config.ts",
  "in-app-navigation.ts",
  "capacitor-utils.ts",
  "native-deep-link.ts",
  "main.tsx",
];

const SKIP_PATH_PARTS = [
  "/views/admin/",
  "/lib/__tests__/",
  "/scripts/",
  "Phase2TrialImport",
  "AcademicResearchPage",
];

const failures = [];

function existsSync(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

function shouldSkip(rel) {
  if (SKIP_FILES.some((f) => rel.endsWith(f))) return true;
  if (SKIP_PATH_PARTS.some((p) => rel.includes(p))) return true;
  for (const part of rel.split("/")) {
    if (SKIP_DIRS.has(part)) return true;
  }
  return false;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = full.slice(ROOT.length + 1);
    if (shouldSkip(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|jsx|js|html)$/.test(name)) out.push(rel);
  }
  return out;
}

function lineOf(text, idx) {
  return text.slice(0, idx).split("\n").length;
}

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function isBareEmptyMessage(raw) {
  const t = raw.trim();
  if (!/^لا توجد/.test(t)) return false;
  if (t.length >= 40) return false;
  if (/حالي|بعد|جرّ?ب|اختر|يمكن|ابدأ|عند|لهذا|منشورة|محفوظ|مطابق|مسجّ|مؤرش|مجلد|تصنيف|فلتر|مسابقة|جديد/i.test(t)) {
    return false;
  }
  return true;
}

function isPublicUiFile(rel) {
  if (rel.includes("/views/admin/") || rel.includes("/pages/admin/")) return false;
  if (rel.startsWith("src/views/") || rel.startsWith("src/pages/")) return true;
  if (rel.startsWith("src/components/home/")) return true;
  if (rel.startsWith("src/components/lobby/")) return true;
  if (rel.startsWith("src/components/filters/")) return true;
  if (rel.startsWith("src/components/assistant/")) return true;
  if (rel === "index.html") return true;
  return false;
}

function scanForbidden(rel, text) {
  if (!/\.(tsx|html)$/.test(rel)) return;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line)) continue;
    if (/^\s*import\s/.test(line)) continue;
    for (const phrase of FORBIDDEN) {
      if (!line.includes(phrase)) continue;
      if (/\/[^/]*majlisilm[^/]*\/[a-z]*/.test(line)) continue;
      if (/SELF_SOURCE|forbiddenBrand|legacyOrigins|FORBIDDEN_UI|majlisilm-shell|majlisilm-version/.test(line)) {
        continue;
      }
      // مفاتيح تخزين أو أسماء CSS — لا تظهر للمستخدم
      if (/className.*majlisilm|majlisilm-app|_KEY\s*=|localStorage\.|\.download\s*=/.test(line)) {
        continue;
      }
      failures.push(`${rel}:${i + 1} — عبارة محظورة: «${phrase}»`);
    }
    if (/(?:>|"|'|`)\s*تجريبي\s*(?:<|"|'|`)/.test(line) || />\s*تجريبي\s*</.test(line)) {
      failures.push(`${rel}:${i + 1} — وسم «تجريبي» في الواجهة`);
    }
  }
}

function scanBareEmpty(rel, text) {
  if (!isPublicUiFile(rel)) return;
  const re = /(["'`])(لا توجد[^"'`]{0,30})\1/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (isBareEmptyMessage(m[2])) {
      failures.push(`${rel}:${lineOf(text, m.index)} — «${m[2]}» بلا توضيح`);
    }
  }
}

function scanEmptyH1(rel, text) {
  if (!isPublicUiFile(rel)) return;
  const re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1].replace(/<[^>]+>/g, "").trim();
    if (!inner) {
      failures.push(`${rel}:${lineOf(text, m.index)} — H1 فارغ`);
      continue;
    }
    // عناوين ديناميكية {title} — مسموحة
    if (/^\{[\w.]+\}$/.test(inner)) continue;
  }
}

function buttonHasAccessibleName(openTag) {
  return /aria-label\s*=/.test(openTag) || /title\s*=/.test(openTag);
}

function scanLongButtons(rel, text) {
  if (!isPublicUiFile(rel)) return;
  const re = /<(?:button|Button)([^>]*)>([\s\S]{0,300}?)<\/(?:button|Button)>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const openTag = m[1];
    const innerRaw = m[2];
    const fromExpr = [...innerRaw.matchAll(/["'`]([^"'`]{1,120})["'`]/g)].map((x) => x[1]).join(" ");
    const inner = (fromExpr || innerRaw
      .replace(/\{[^}]*\}/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim());
    if (!inner) {
      if (/^\{\s*[\w.]+\s*\}$/.test(innerRaw.trim())) continue;
      if (!buttonHasAccessibleName(openTag) && !/sr-only|visually-hidden/.test(innerRaw)) {
        failures.push(`${rel}:${lineOf(text, m.index)} — زر بلا نص ولا aria-label`);
      }
      continue;
    }
    if (inner.includes("{") || inner.includes("}")) continue;
    if (inner.length > 80) {
      failures.push(`${rel}:${lineOf(text, m.index)} — زر طويل (${inner.length} حرف): «${inner.slice(0, 40)}…»`);
    }
  }
}

console.log("▶ check-copy-quality\n");

const files = walk(resolve(ROOT, "src"));
if (existsSync(resolve(ROOT, "index.html"))) {
  files.push("index.html");
}

for (const rel of files) {
  const text = readFileSync(resolve(ROOT, rel), "utf8");
  scanForbidden(rel, text);
  if (rel.endsWith(".tsx") || rel.endsWith(".html")) {
    scanBareEmpty(rel, text);
    scanEmptyH1(rel, text);
    scanLongButtons(rel, text);
  }
}

if (failures.length) {
  console.error(`❌ check-copy-quality فشل (${failures.length}):`);
  for (const f of failures.slice(0, 80)) console.error(`   ${f}`);
  if (failures.length > 80) console.error(`   … و${failures.length - 80} أخرى`);
  process.exit(1);
}

console.log("✅ check-copy-quality — نجح");
