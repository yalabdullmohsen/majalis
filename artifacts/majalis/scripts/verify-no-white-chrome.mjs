/**
 * كروم التخطيط يطابق لون الصفحة (--surface-app) لا مجرّد «ليس أبيض».
 * تشغيل: node scripts/verify-no-white-chrome.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PAGE_TOKEN = /--surface-app|--mj-bg|--app-bg/;
const RAISED_TOKEN = /--mj-surface|--color-surface/;
const FORBIDDEN_BG_CLASS = /\bbg-white\b|\bbg-background\b/;
const FORBIDDEN_PAGE_HEX = /#(?:fff(?:fff)?|fafafa|f5f5f5|f7f4ed|fafbfa|f8faf9)\b/i;
const PAGE_CHROME_SEL =
  /(^|[,\s>+~])(#root|\.app-shell|\.majlisilm-app|header\.navbar-v3|\.navbar-v3|\.top-section-bar|\.bottom-nav|\.bottom-nav--v2|\.section-lobby)(\s*[,{]|$)/;
const BG_DECL = /background(?:-color)?\s*:[^;]+/g;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|css)$/.test(name)) acc.push(p);
  }
  return acc;
}

const overlayFiles = [
  join(root, "src/components/ui/sheet.tsx"),
  join(root, "src/components/ui/drawer.tsx"),
  join(root, "src/components/ui/dialog.tsx"),
  join(root, "src/components/ui/alert-dialog.tsx"),
];

const pageChromeFiles = [
  ...walk(join(root, "src/components/layout")),
  join(root, "src/styles/components/app-chrome-scroll.css"),
  join(root, "src/styles/m2030/foundation.css"),
  join(root, "src/styles/final-release.css"),
  join(root, "src/styles/m2030/navigation.css"),
  join(root, "src/components/lobby/section-lobby.css"),
];

const theme = readFileSync(join(root, "src/app/styles/theme.css"), "utf8");
assert.match(theme, /--surface-app:\s*#F2F4F3/, "theme: --surface-app نهاري");
assert.match(theme, /--mj-bg:\s*var\(--surface-app\)/, "theme: --mj-bg ← --surface-app");
assert.match(theme, /\[data-on-dark\]/, "theme: سياق on-dark");
assert.match(theme, /\.on-dark\s*\{/, "theme: صنف .on-dark");

const hits = [];

function scanCss(file) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  const blocks = text.split("}");
  for (const block of blocks) {
    const brace = block.indexOf("{");
    if (brace < 0) continue;
    const sel = block.slice(0, brace).replace(/\/\*[\s\S]*?\*\//g, "");
    const body = block.slice(brace + 1);
    if (!PAGE_CHROME_SEL.test(sel)) continue;
    for (const decl of body.match(BG_DECL) || []) {
      if (/splash|transparent|none/.test(decl) && !PAGE_TOKEN.test(decl) && !FORBIDDEN_PAGE_HEX.test(decl)) {
        continue;
      }
      if (FORBIDDEN_PAGE_HEX.test(decl) || FORBIDDEN_BG_CLASS.test(decl)) {
        hits.push(`${rel}: هكس/صنف لا يطابق الصفحة في «${sel.trim().slice(0, 80)}»: ${decl.trim()}`);
        continue;
      }
      if (!PAGE_TOKEN.test(decl)) {
        hits.push(`${rel}: كروم الصفحة بلا --surface-app في «${sel.trim().slice(0, 80)}»: ${decl.trim()}`);
      }
    }
  }
}

function scanOverlay(file) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  for (const [i, line] of text.split("\n").entries()) {
    if (FORBIDDEN_BG_CLASS.test(line) && /bg-white|bg-background/.test(line)) {
      hits.push(`${rel}:${i + 1}: overlay يستخدم bg-white/bg-background: ${line.trim()}`);
      continue;
    }
    if (!/background|bg-\[/.test(line)) continue;
    if (/bg-black|transparent|none|Overlay/.test(line)) continue;
    if (!PAGE_TOKEN.test(line) && !RAISED_TOKEN.test(line)) {
      hits.push(`${rel}:${i + 1}: overlay بلا رمز صفحة/سطح: ${line.trim()}`);
    }
  }
}

for (const file of pageChromeFiles) scanCss(file);
for (const file of overlayFiles) scanOverlay(file);

assert.equal(hits.length, 0, `كروم التخطيط يجب أن يطابق --surface-app:\n${hits.join("\n")}`);

console.log(
  `verify-no-white-chrome.mjs: ok (صفحة ${pageChromeFiles.length} · overlay ${overlayFiles.length})`,
);
