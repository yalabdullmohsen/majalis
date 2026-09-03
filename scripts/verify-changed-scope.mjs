#!/usr/bin/env node
/**
 * فحص نطاق التغييرات + سياسات CI — يقرر أي بوابات تُشغَّل للـ PR.
 * يكتب reports/changed-scope-report.md
 *
 * Usage:
 *   node scripts/verify-changed-scope.mjs
 *   node scripts/verify-changed-scope.mjs --json
 *   node scripts/verify-changed-scope.mjs --run   # يشغّل verify:ci-fast إن أمكن
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyScopes } from "./ci/changed-scope.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAJALIS = resolve(ROOT, "artifacts/majalis");
const REPORT_MD = resolve(ROOT, "reports/changed-scope-report.md");
const REPORT_JSON = resolve(ROOT, "reports/changed-scope-verify.json");

function listChangedFiles() {
  try {
    const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    const diff = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const staged = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return [...new Set([...diff.split("\n"), ...staged.split("\n")].map((s) => s.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

/** @returns {string[]} */
function policyViolations(paths) {
  /** @type {string[]} */
  const issues = [];

  const routesSrc = existsSync(resolve(MAJALIS, "src/AppRoutes.tsx"))
    ? readFileSync(resolve(MAJALIS, "src/AppRoutes.tsx"), "utf8")
    : "";
  const sitemapSrc = existsSync(resolve(MAJALIS, "public/sitemap.xml"))
    ? readFileSync(resolve(MAJALIS, "public/sitemap.xml"), "utf8")
    : "";

  for (const forbidden of ["/internal", "/review"]) {
    const routeRe = new RegExp(`<Route\\s+path=["']${forbidden.replace("/", "\\/")}["']`, "i");
    if (routeRe.test(routesSrc)) {
      issues.push(`مسار داخلي مفعّل في AppRoutes: ${forbidden}`);
    }
    if (sitemapSrc.includes(`<loc>https://www.ssunnah.com${forbidden}</loc>`)) {
      issues.push(`مسار داخلي في sitemap: ${forbidden}`);
    }
  }

  const mushafCssChanged = paths.some(
    (p) =>
      /mushaf.*\.css$/i.test(p) ||
      /quran-font-size/i.test(p) ||
      /useMushafPageFontFit/i.test(p) ||
      /useNewMushafFontFit/i.test(p),
  );
  if (mushafCssChanged) {
    issues.push("تغيير محتمل على خط/مقياس المصحف أو التفسير — ممنوع بدون مراجعة");
  }

  const userFacing = paths.filter((p) => /^artifacts\/majalis\/src\//i.test(p));
  for (const p of userFacing) {
    try {
      const body = readFileSync(resolve(ROOT, p), "utf8");
      if (/>\s*Majlisilm\s*</.test(body) || />\s*المجلس العلمي\s*</.test(body)) {
        issues.push(`نص Majlisilm/المجلس العلمي ظاهر للمستخدم في ${p}`);
      }
    } catch {
      /* ignore unreadable */
    }
  }

  return issues;
}

function renderMarkdown(result, paths, violations) {
  const { checks, scopes, docsOnly } = result;
  const lines = [
    "# تقرير نطاق التغييرات",
    "",
    `**التاريخ:** ${new Date().toISOString()}`,
    `**عدد الملفات:** ${paths.length}`,
    `**النطاقات:** ${scopes.join("، ") || "—"}`,
    `**docs-only:** ${docsOnly ? "نعم" : "لا"}`,
    "",
    "## البوابات المقترحة",
    "",
    "| البوابة | مطلوب |",
    "|---------|-------|",
    ...Object.entries(checks).map(([k, v]) => `| ${k} | ${v ? "✓" : "—"} |`),
    "",
    "## الملفات المتغيرة (أول 40)",
    "",
    ...paths.slice(0, 40).map((p) => `- \`${p}\` → ${result.byPath[p] ?? "?"}`),
    paths.length > 40 ? `\n… +${paths.length - 40} ملفًا` : "",
    "",
  ];

  if (violations.length) {
    lines.push("## ⚠️ مخالفات سياسة", "", ...violations.map((v) => `- ${v}`), "");
  } else {
    lines.push("## سياسات", "", "- لا مخالفات (Majlisilm، مراجعة داخلية، خط المصحف).", "");
  }

  lines.push(
    "## أوامر محلية",
    "",
    "- PR صغير / docs: `pnpm run verify:changed`",
    "- PR سريع: `pnpm run verify:ci-fast`",
    "- main/release: `pnpm run verify:ci-full`",
    "",
  );
  return lines.join("\n");
}

function main() {
  const paths = listChangedFiles();
  const result = classifyScopes(paths);
  const violations = policyViolations(paths);

  mkdirSync(resolve(ROOT, "reports"), { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    paths,
    scopes: result.scopes,
    scopeIds: result.scopeIds,
    checks: result.checks,
    outputs: result.outputs,
    docsOnly: result.docsOnly,
    violations,
    ok: violations.length === 0,
  };

  writeFileSync(REPORT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(REPORT_MD, `${renderMarkdown(result, paths, violations)}\n`);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`changed-scope-report → ${REPORT_MD}`);
    console.log(JSON.stringify({ checks: result.checks, violations }, null, 2));
  }

  if (violations.length) {
    console.error("فشل verify-changed-scope — مخالفات سياسة:");
    for (const v of violations) console.error(`  • ${v}`);
    process.exit(1);
  }

  if (process.argv.includes("--run")) {
    const args = ["run", "verify:ci-fast"];
    const r = spawnSync("pnpm", args, { cwd: ROOT, stdio: "inherit", shell: true });
    process.exit(r.status ?? 1);
  }
}

main();
