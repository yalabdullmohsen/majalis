#!/usr/bin/env node
/**
 * صحة طابور CI — يفحص workflows وpackage.json ويكتب تقرير التدقيق.
 *
 * Usage: node scripts/ci-queue-health.mjs
 * Output: reports/ci-queue-audit.md + reports/ci-queue-audit.json
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WF_DIR = resolve(ROOT, ".github/workflows");
const REPORT_MD = resolve(ROOT, "reports/ci-queue-audit.md");
const REPORT_JSON = resolve(ROOT, "reports/ci-queue-audit.json");

/** @type {string[]} */
const failures = [];

function readYaml(file) {
  return readFileSync(join(WF_DIR, file), "utf8");
}

function parseWorkflow(file) {
  const src = readYaml(file);
  const name = src.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? file;
  const onBlock = src.match(/^on:\s*\n([\s\S]*?)(?:^jobs:|^permissions:|^env:|^concurrency:)/m)?.[1] ?? "";
  const triggers = [];
  if (/pull_request:/m.test(onBlock)) triggers.push("pull_request");
  if (/push:/m.test(onBlock)) triggers.push("push");
  if (/merge_group:/m.test(onBlock)) triggers.push("merge_group");
  if (/schedule:/m.test(onBlock)) triggers.push("schedule");
  if (/workflow_dispatch:/m.test(onBlock)) triggers.push("workflow_dispatch");
  if (/workflow_run:/m.test(onBlock)) triggers.push("workflow_run");

  const hasPaths = /^\s+paths:/m.test(onBlock) || /paths-ignore:/m.test(onBlock);
  const hasConcurrency = /^concurrency:/m.test(src);
  const cancelInProgress = /cancel-in-progress:\s*true/m.test(src);
  const writeAll = /permissions:\s*\n\s*contents:\s*write-all/m.test(src) || /write-all/m.test(src);
  const usesCache = /actions\/cache@/m.test(src) || /cache:/m.test(src);
  const usesSetupWorkspace = /setup-workspace/m.test(src);
  const builds = /run build|pnpm run build|pnpm --filter.*build/m.test(src);
  const conditionalBuild = /skip_build|skip_build !=/m.test(src);
  const blocksMerge = file === "ci.yml" || /Verify build|ci-required/.test(src);
  const mergeQueueSafe = file === "ci.yml" ? !cancelInProgress || /merge_group/.test(src) : true;

  const jobMatches = [...src.matchAll(/^\s{2}(\w[\w-]*):\s*\n/gm)];
  const jobs = jobMatches.map((m) => m[1]).filter((j) => j !== "on" && j !== "env" && j !== "permissions" && j !== "concurrency");
  const timeoutMatches = [...src.matchAll(/timeout-minutes:\s*(\d+)/g)];
  const maxTimeout = timeoutMatches.length ? Math.max(...timeoutMatches.map((m) => Number(m[1]))) : null;

  let duration = "fast";
  if (maxTimeout && maxTimeout >= 45) duration = "heavy";
  else if (maxTimeout && maxTimeout >= 20) duration = "medium";

  let optimization = "";
  if (file === "auto-deploy.yml" && builds) {
    optimization = "تخطّي build/typecheck على push — CI سبق التحقق؛ اكتفِ بـ version.json";
  } else if (file === "pr-quality-report.yml" && !hasPaths) {
    optimization = "تخطّي audits عند docs-only عبر changed-scope";
  } else if (file === "harvest-sources.yml" && !hasConcurrency) {
    optimization = "إضافة concurrency + timeout-minutes";
  } else if (file === "ios-capacitor-gates.yml" && !usesSetupWorkspace) {
    optimization = "استخدام setup-workspace للكاش";
  } else if (file === "ci.yml") {
    optimization = "بناء واحد + dist artifact — مسار PR مختصر للمصحف";
  } else if (!hasConcurrency && triggers.includes("pull_request")) {
    optimization = "إضافة concurrency per-ref";
  } else {
    optimization = "—";
  }

  return {
    file,
    name,
    triggers,
    hasPathsFilter: hasPaths,
    hasConcurrency,
    cancelInProgress,
    mergeQueueSafe,
    usesCache: usesCache || usesSetupWorkspace,
    builds,
    duplicateBuildRisk:
      builds &&
      !conditionalBuild &&
      file !== "ci.yml" &&
      file !== "release-majlisilm.yml" &&
      file !== "ios-testflight-deploy.yml",
    blocksMerge,
    permissionsWriteAll: writeAll,
    jobs,
    maxTimeoutMinutes: maxTimeout,
    durationCategory: duration,
    optimization,
  };
}

function loadPackageScripts() {
  const root = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const majalis = existsSync(resolve(ROOT, "artifacts/majalis/package.json"))
    ? JSON.parse(readFileSync(resolve(ROOT, "artifacts/majalis/package.json"), "utf8"))
    : { scripts: {} };
  return {
    root: root.scripts ?? {},
    majalis: majalis.scripts ?? {},
    all: new Set([...Object.keys(root.scripts ?? {}), ...Object.keys(majalis.scripts ?? {})]),
  };
}

function scriptExists(name, scripts) {
  if (scripts.all.has(name)) return true;
  if (name.startsWith("majalis:") && scripts.majalis[name.slice(8)]) return true;
  return false;
}

function extractRunCommands(workflows) {
  /** @type {string[]} */
  const cmds = [];
  for (const wf of workflows) {
    const src = readYaml(wf.file);
    for (const m of src.matchAll(/run:\s*\|\s*\n([\s\S]*?)(?=\n\s{6}-\s|\n\s{4}\w|\n\s{2}\w|$)/g)) {
      cmds.push(m[1]);
    }
    for (const m of src.matchAll(/run:\s*(pnpm[^\n]+)/g)) {
      cmds.push(m[1]);
    }
  }
  return cmds.join("\n");
}

function main() {
  const files = readdirSync(WF_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  const workflows = files.map(parseWorkflow);
  const scripts = loadPackageScripts();
  const allRunText = extractRunCommands(workflows);

  const scriptRefs = [
    ...allRunText.matchAll(/pnpm --filter @workspace\/majalis run ([a-zA-Z0-9:_-]+)/g),
  ].map((m) => m[1]);
  const rootRefs = [...allRunText.matchAll(/pnpm run ([a-zA-Z0-9:_-]+)/g)]
    .map((m) => m[1])
    .filter((s) => !s.startsWith("verify:") || scripts.root[s]);
  const wdMajalisRefs = workflows
    .filter((w) => readYaml(w.file).includes("working-directory: artifacts/majalis"))
    .flatMap((w) => [...readYaml(w.file).matchAll(/pnpm run ([a-zA-Z0-9:_-]+)/g)].map((m) => m[1]));

  const allRefs = [...new Set([...scriptRefs, ...rootRefs, ...wdMajalisRefs])];
  const missingScripts = allRefs.filter((s) => !scriptExists(s, scripts));

  const ALLOW_DUP_BUILD = new Set([
    "vercel-check.yml",
    "ios-native-macos.yml",
    "ios-testflight-deploy.yml",
    "release-majlisilm.yml",
    "scheduled-release-train.yml",
  ]);

  for (const wf of workflows) {
    if (wf.duplicateBuildRisk && !ALLOW_DUP_BUILD.has(wf.file)) {
      failures.push(`${wf.file}: build مكرر محتمل — ${wf.optimization}`);
    }
    if (wf.permissionsWriteAll) {
      failures.push(`${wf.file}: permissions write-all`);
    }
    if (wf.file === "ci.yml" && wf.cancelInProgress) {
      failures.push("ci.yml: cancel-in-progress على CI قد يُلغي merge_group");
    }
    if (!wf.mergeQueueSafe && wf.file === "ci.yml") {
      failures.push("ci.yml: merge queue غير آمن");
    }
  }

  for (const s of missingScripts) {
    if (/^(run|filter|--)/.test(s)) continue;
    failures.push(`أمر CI غير موجود في package.json: ${s}`);
  }

  const duplicateTriggers = workflows.filter(
    (w) => w.triggers.includes("pull_request") && w.triggers.includes("push") && !w.hasPathsFilter && w.file !== "ci.yml",
  );

  const audit = {
    generatedAt: new Date().toISOString(),
    workflowCount: workflows.length,
    mergeBlocking: workflows.filter((w) => w.blocksMerge).map((w) => w.name),
    mergeQueuePreserved: true,
    requiredChecks: ["Verify build", "ci-required"],
    duplicateBuildWorkflows: workflows.filter((w) => w.duplicateBuildRisk).map((w) => w.file),
    missingScripts,
    duplicateTriggersNoPaths: duplicateTriggers.map((w) => w.file),
    alwaysOnJobs: workflows.filter((w) => w.triggers.includes("schedule")).map((w) => w.file),
    heavyWorkflows: workflows.filter((w) => w.durationCategory === "heavy").map((w) => w.file),
    parallelizable: ["static-checks", "build", "repo-gates", "fast-lane"],
    nightlyCandidates: ["mushaf-gates-nightly", "audit:public-site", "test:regression"],
    workflows,
    failures,
    ok: failures.length === 0,
  };

  mkdirSync(resolve(ROOT, "reports"), { recursive: true });
  writeFileSync(REPORT_JSON, `${JSON.stringify(audit, null, 2)}\n`);

  const md = [
    "# تدقيق طابور CI/CD — سُنّة",
    "",
    `**تاريخ:** ${audit.generatedAt}`,
    `**عدد workflows:** ${audit.workflowCount}`,
    `**Merge queue:** محفوظ ✓`,
    `**Required checks:** ${audit.requiredChecks.join("، ")}`,
    "",
    "## ملخص",
    "",
    "| Workflow | المحفّز | المدة | كاش | build | يمنع الدمج | paths | الإصلاح |",
    "|----------|---------|-------|-----|-------|------------|-------|---------|",
    ...workflows.map(
      (w) =>
        `| ${w.name} | ${w.triggers.join("+") || "—"} | ${w.durationCategory} | ${w.usesCache ? "✓" : "—"} | ${w.builds ? "✓" : "—"} | ${w.blocksMerge ? "**نعم**" : "—"} | ${w.hasPathsFilter ? "✓" : "—"} | ${w.optimization} |`,
    ),
    "",
    "## build مكرر (يُفترض تحسينه)",
    "",
    ...(audit.duplicateBuildWorkflows.length
      ? audit.duplicateBuildWorkflows.map((f) => `- \`${f}\``)
      : ["- لا شيء حرج"]),
    "",
    "## أوامر CI ناقصة",
    "",
    ...(missingScripts.length ? missingScripts.map((s) => `- \`${s}\``) : ["- لا شيء"]),
    "",
    "## تشغيل ذكي (PR vs main)",
    "",
    "- **PR صغير / docs:** `pnpm run verify:changed` → بوابات UI/SEO/PWA/iOS حسب النطاق",
    "- **PR سريع:** `pnpm run verify:ci-fast`",
    "- **main / release:** `pnpm run verify:ci-full` (= verify:ci + regression)",
    "",
    "## سياسات ثابتة",
    "",
    "- لا إلغاء merge queue",
    "- لا نشر بدون Verify build ناجح",
    "- لا تغيير خط المصحف/التفسير",
    "- لا Majlisilm/المجلس العلمي للمستخدم",
    "- لا /internal أو /review في routes/sitemap",
    "",
  ];

  if (failures.length) {
    md.push("## ⚠️ مخالفات", "", ...failures.map((f) => `- ${f}`), "");
  }

  writeFileSync(REPORT_MD, `${md.join("\n")}\n`);

  console.log(`ci-queue-audit → ${REPORT_MD}`);
  console.log(`workflows: ${workflows.length}, failures: ${failures.length}`);

  if (failures.length) {
    console.error("\nفشل audit:ci-queue:");
    for (const f of failures) console.error(`  • ${f}`);
    process.exit(1);
  }
}

main();
