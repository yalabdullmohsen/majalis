#!/usr/bin/env node
/**
 * بوابة تراخيص الوحدة ٤٨ — تفشل عند:
 * 1) غياب docs/LICENSES.md أو صفوف أصول إلزامية
 * 2) تبعية بترخيص GPL/AGPL/SSPL/… صِرف (بلا خيار تساهلي)
 *
 * تشغيل: node scripts/verify-licenses-gate.mjs
 * من جذر majalis أو عبر pnpm run test:licenses
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = resolve(appRoot, "../..");
const licensesMd = join(monorepoRoot, "docs/LICENSES.md");

const REQUIRED_ASSET_MARKERS = [
  "خطوط QPC",
  "نص عثماني",
  "تلاوات صوتية",
  "تفاسير",
  "حصن المسلم",
  "كتب المكتبة",
  "Amiri",
  "test:licenses",
];

/** تراخيص صِرفة ممنوعة في منتج مغلق (ما لم تُقرن بخيار تساهلي عبر OR). */
const FORBIDDEN_SOLE = [
  /^gpl-2\.0$/i,
  /^gpl-3\.0$/i,
  /^gpl$/i,
  /^agpl/i,
  /^sspl/i,
  /^commons-clause/i,
  /^busl/i,
  /^cpal/i,
  /^osu$/i,
];

const PERMISSIVE_TOKENS = [
  "mit",
  "apache",
  "bsd",
  "isc",
  "0bsd",
  "unlicense",
  "cc0",
  "blueoak",
  "mpl",
  "ofl",
  "zlib",
  "wtfpl",
  "python",
  "postgresql",
];

function normalizeLicenseField(raw) {
  return String(raw || "Unknown")
    .replace(/[()]/g, " ")
    .split(/\s+OR\s+|\s+AND\s+|\s*\|\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isForbiddenLicenseExpression(expr) {
  const parts = normalizeLicenseField(expr);
  if (parts.length === 0) return false;
  const hasPermissive = parts.some((p) =>
    PERMISSIVE_TOKENS.some((t) => p.toLowerCase().includes(t)),
  );
  if (hasPermissive) return false;
  /* LGPL مسموح كربط ديناميكي لأدوات أصلية — لا يُرفض هنا */
  if (parts.every((p) => /lgpl/i.test(p))) return false;
  return parts.some((p) => FORBIDDEN_SOLE.some((re) => re.test(p.replace(/\s+/g, ""))));
}

const issues = [];

if (!existsSync(licensesMd)) {
  issues.push(`مفقود: ${licensesMd}`);
} else {
  const body = readFileSync(licensesMd, "utf8");
  for (const marker of REQUIRED_ASSET_MARKERS) {
    if (!body.includes(marker)) issues.push(`docs/LICENSES.md ينقصه ذكر: ${marker}`);
  }
  if (!/مطلوب|غير محسوم|جزئي|ممنوح/.test(body)) {
    issues.push("docs/LICENSES.md بلا حالات إذن واضحة");
  }
}

/* صفحة المصادر داخل التطبيق يجب أن تشير للجرد */
const sourcesPage = join(appRoot, "src/views/SourcesLicensesPage.tsx");
if (!existsSync(sourcesPage)) {
  issues.push("SourcesLicensesPage.tsx مفقود");
} else {
  const sp = readFileSync(sourcesPage, "utf8");
  for (const needle of ["QPC", "Tanzil", "everyayah", "حصن المسلم", "LICENSES"]) {
    if (!sp.includes(needle)) issues.push(`SourcesLicensesPage ينقصه: ${needle}`);
  }
}

let licenseJson;
try {
  const out = execSync("pnpm licenses list --json", {
    cwd: appRoot,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
  licenseJson = JSON.parse(out);
} catch (err) {
  // إعادة محاولة واحدة — فشل عابر شائع على CI عند ضغط الذاكرة/القرص
  try {
    const out = execSync("pnpm licenses list --json", {
      cwd: monorepoRoot,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    licenseJson = JSON.parse(out);
  } catch (err2) {
    issues.push(
      `تعذّر pnpm licenses list: ${err2 instanceof Error ? err2.message : String(err2)} (أول محاولة: ${err instanceof Error ? err.message : String(err)})`,
    );
    licenseJson = null;
  }
}

const forbiddenHits = [];
if (licenseJson && typeof licenseJson === "object") {
  for (const [lic, pkgs] of Object.entries(licenseJson)) {
    if (!isForbiddenLicenseExpression(lic)) continue;
    const names = (pkgs || []).map((p) => p.name).filter(Boolean);
    forbiddenHits.push({ lic, names: names.slice(0, 20), count: names.length });
  }
}

if (forbiddenHits.length > 0) {
  for (const hit of forbiddenHits) {
    issues.push(
      `ترخيص ممنوع «${hit.lic}» ×${hit.count}: ${hit.names.join(", ") || "(بدون اسم)"}`,
    );
  }
}

if (issues.length) {
  console.error("verify-licenses-gate: FAILED");
  for (const i of issues) console.error(`  ✗ ${i}`);
  process.exit(1);
}

console.log("verify-licenses-gate: ok");
console.log(`  docs/LICENSES.md ✓`);
console.log(`  SourcesLicensesPage ✓`);
console.log(`  npm licenses scanned: ${licenseJson ? Object.keys(licenseJson).length : 0} groups`);
