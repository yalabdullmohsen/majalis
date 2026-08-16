#!/usr/bin/env node
/**
 * verify:pr — بوابة جاهزية الدمج المحلية (fail فقط على P0).
 *
 * يشغّل: typecheck · lint · build · audit:public-site · audit:data-completeness ·
 *         audit:seo · audit:feature-readiness
 *
 * أمر/سكربت غير موجود → تحذير ويكمل (لا فشل).
 *
 *   pnpm run verify:pr
 *   pnpm run verify:pr -- --skip-build
 *   pnpm run verify:pr -- --json
 */
import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { countBySeverity, finding } from "./ci/severity.mjs";
import { classifyScopes } from "./ci/changed-scope.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAJALIS = resolve(ROOT, "artifacts/majalis");
const REPORT_DIR = resolve(ROOT, "reports");
const argv = process.argv.slice(2);
const SKIP_BUILD = argv.includes("--skip-build");
const JSON_OUT = argv.includes("--json");

type StepResult = {
  name: string;
  status: "ok" | "p0" | "warn" | "skip";
  detail?: string;
  findings?: Array<{ severity: string; message: string }>;
};

function changedPaths(): string[] {
  try {
    const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const staged = execFileSync("git", ["diff", "--name-only", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return [...new Set([...out.split("\n"), ...staged.split("\n")].filter(Boolean))];
  } catch {
    return [];
  }
}

function run(name: string, args: string[], cwd = ROOT): StepResult {
  const r = spawnSync("pnpm", args, { cwd, encoding: "utf8", env: process.env });
  if (r.error && (r.error as NodeJS.ErrnoException).code === "ENOENT") {
    return { name, status: "warn", detail: "pnpm غير موجود" };
  }
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  if (r.status === 0) return { name, status: "ok" };
  return {
    name,
    status: "p0",
    detail: out.trim().slice(-1200) || `exit ${r.status}`,
    findings: [finding("P0", `${name} فشل`)],
  };
}

function runAuditSync(scriptName: string): StepResult {
  const pkg = resolve(MAJALIS, "package.json");
  if (!existsSync(pkg)) {
    return { name: scriptName, status: "warn", detail: "package majalis غير موجود" };
  }
  const scripts = JSON.parse(readFileSync(pkg, "utf8")).scripts || {};
  if (!scripts[scriptName]) {
    return {
      name: scriptName,
      status: "warn",
      detail: "السكربت غير معرّف في package.json — تخطّي",
    };
  }
  const r = spawnSync("pnpm", ["run", scriptName], {
    cwd: MAJALIS,
    encoding: "utf8",
    env: process.env,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  let parsed: {
    P0?: number;
    P1?: number;
    merge_ok?: boolean;
    pages_checked?: number;
    admin_excluded?: number;
  } | null = null;
  const brace = out.lastIndexOf("\n{");
  const start = brace >= 0 ? brace + 1 : out.lastIndexOf("{");
  if (start >= 0) {
    try {
      parsed = JSON.parse(out.slice(start));
    } catch {
      parsed = null;
    }
  }
  if (r.status === 0 || parsed?.merge_ok === true || parsed?.P0 === 0) {
    return {
      name: scriptName,
      status: "ok",
      detail: parsed
        ? `P0=${parsed.P0 ?? 0} P1=${parsed.P1 ?? 0} pages=${parsed.pages_checked ?? "-"} admin=${parsed.admin_excluded ?? "-"}`
        : undefined,
    };
  }
  return {
    name: scriptName,
    status: "p0",
    detail: out.trim().slice(-1500),
    findings: [finding("P0", `${scriptName} فشل`)],
  };
}

const paths = changedPaths();
const scope = classifyScopes(paths);
const steps: StepResult[] = [];

console.log("verify:pr — جاهزية الدمج (فشل فقط عند P0)");
console.log(`scopes: ${scope.scopes.join(", ") || "(none)"} · files=${paths.length}`);

steps.push(run("typecheck", ["run", "typecheck"]));
steps.push(run("lint", ["run", "lint"]));
if (!SKIP_BUILD) {
  steps.push(run("build", ["--filter", "@workspace/majalis", "run", "build"]));
} else {
  steps.push({ name: "build", status: "skip", detail: "--skip-build" });
}

for (const audit of [
  "audit:public-site",
  "audit:data-completeness",
  "audit:seo",
  "audit:feature-readiness",
] as const) {
  steps.push(runAuditSync(audit));
}

const allFindings = steps.flatMap((s) => s.findings || []);
const counts = countBySeverity(allFindings);
const p0Steps = steps.filter((s) => s.status === "p0");
const warnings = steps.filter((s) => s.status === "warn");
const mergeOk = p0Steps.length === 0 && counts.P0 === 0;

const summary = {
  merge_ok: mergeOk,
  P0: counts.P0 + p0Steps.length,
  P1: counts.P1,
  P2: counts.P2,
  warnings: warnings.length,
  scopes: scope.scopes,
  steps: steps.map((s) => ({
    name: s.name,
    status: s.status,
    detail: s.detail?.slice(0, 200),
  })),
  admin_note: "/admin/* مستثناة من P0 meta description؛ مطلوب noindex خارج sitemap",
  reason: mergeOk ? "لا P0" : p0Steps.map((s) => s.name).join(", "),
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(
  resolve(REPORT_DIR, "verify-pr-ready-latest.json"),
  JSON.stringify({ summary, steps, scope }, null, 2),
);

const shortMd = [
  "## verify:pr",
  "",
  `- **يمكن الدمج؟** ${mergeOk ? "نعم" : "لا"}`,
  `- **P0:** ${summary.P0} · **P1:** ${summary.P1} · تحذيرات أوامر: ${warnings.length}`,
  `- **scopes:** ${scope.scopes.join(", ") || "—"}`,
  `- **السبب:** ${summary.reason}`,
  "- التقرير الكامل: `reports/verify-pr-ready-latest.json`",
  "",
].join("\n");
writeFileSync(resolve(REPORT_DIR, "verify-pr-ready-summary.md"), shortMd);

if (JSON_OUT) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  for (const s of steps) {
    const icon =
      s.status === "ok" ? "✓" : s.status === "skip" ? "·" : s.status === "warn" ? "!" : "✗";
    console.log(`  ${icon} ${s.name}${s.detail ? ` — ${s.detail.split("\n")[0]}` : ""}`);
  }
  console.log(shortMd);
}

process.exit(mergeOk ? 0 : 1);
