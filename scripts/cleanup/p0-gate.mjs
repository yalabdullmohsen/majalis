#!/usr/bin/env node
/**
 * سُنّة — Cleanup P0 baseline collector + gate.
 * Regenerates docs/cleanup/baseline.json and validates P0 artifacts.
 *
 * Usage:
 *   node scripts/cleanup/p0-gate.mjs           # validate + refresh baseline metrics that are cheap
 *   node scripts/cleanup/p0-gate.mjs --write   # rewrite baseline.json from live probes
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DOCS = join(ROOT, "docs/cleanup");
const WRITE = process.argv.includes("--write");

const REQUIRED_DOCS = [
  "P0_BASELINE.md",
  "P0_ARCHITECTURE_MAP.md",
  "P0_DEPENDENCY_GRAPH.md",
  "P0_PROTECTED_CONTENT.md",
  "P0_RELEASE_BLOCKERS.md",
  "P0_ROLLBACK_PLAN.md",
  "baseline.json",
  "architecture-inventory.json",
];

function sh(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    }).trim();
  } catch (e) {
    return opts.allowFail ? (e.stdout || "").toString().trim() : (() => { throw e; })();
  }
}

function countFiles(rel, exts = null) {
  const base = join(ROOT, rel);
  let n = 0;
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (
        ent.name === "node_modules" ||
        ent.name === "dist" ||
        ent.name === ".git" ||
        ent.name === "coverage" ||
        ent.name === "Pods" ||
        ent.name === ".gradle"
      ) {
        continue;
      }
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (!exts || exts.some((e) => ent.name.endsWith(e))) n += 1;
    }
  };
  walk(base);
  return n;
}

function pkgCounts(pkgPath) {
  const p = JSON.parse(readFileSync(join(ROOT, pkgPath), "utf8"));
  return {
    dependencies: Object.keys(p.dependencies || {}).length,
    devDependencies: Object.keys(p.devDependencies || {}).length,
    scripts: Object.keys(p.scripts || {}).length,
  };
}

function collectBaseline() {
  const commit = sh("git", ["rev-parse", "HEAD"]);
  const branch = sh("git", ["branch", "--show-current"]);
  const majalis = pkgCounts("artifacts/majalis/package.json");
  const root = pkgCounts("package.json");

  let tscOk = false;
  let tscMs = null;
  const t0 = Date.now();
  try {
    sh("pnpm", ["--filter", "@workspace/majalis", "exec", "tsc", "-p", "tsconfig.json", "--noEmit", "--pretty", "false"]);
    tscOk = true;
    tscMs = Date.now() - t0;
  } catch {
    tscOk = false;
    tscMs = Date.now() - t0;
  }

  let lintOk = false;
  const l0 = Date.now();
  let lintMs = null;
  try {
    sh("pnpm", ["--filter", "@workspace/majalis", "run", "lint"]);
    lintOk = true;
    lintMs = Date.now() - l0;
  } catch {
    lintOk = false;
    lintMs = Date.now() - l0;
  }

  return {
    brand: "سُنّة",
    phase: "cleanup-p0",
    collectedAt: new Date().toISOString(),
    git: {
      commit,
      branch,
      baseCommitNote: "baseline taken on cleanup P0 branch tip / main parent",
    },
    scale: {
      filesRepoApprox: countFiles("."),
      filesMajalisApprox: countFiles("artifacts/majalis"),
      majalisSrcTsFiles: countFiles("artifacts/majalis/src", [".ts", ".tsx"]),
      majalisScriptsCount: majalis.scripts,
    },
    dependencies: {
      rootDevDependencies: root.devDependencies,
      majalisDependencies: majalis.dependencies,
      majalisDevDependencies: majalis.devDependencies,
      lockfileNote: "pnpm-lock.yaml — use pnpm why / audit for transitive depth",
    },
    qualityBaseline: {
      typecheckPass: tscOk,
      typecheckMs: tscMs,
      lintPass: lintOk,
      lintMs: lintMs,
      typescriptErrorsKnown: tscOk ? 0 : "nonzero",
      lintWarningsPolicy: "eslint --max-warnings 0 on majalis src+lib",
    },
    workspaces: {
      artifacts: readdirSync(join(ROOT, "artifacts")).filter((n) => {
        try {
          return statSync(join(ROOT, "artifacts", n)).isDirectory();
        } catch {
          return false;
        }
      }),
      libs: readdirSync(join(ROOT, "lib")).filter((n) => {
        try {
          return statSync(join(ROOT, "lib", n)).isDirectory();
        } catch {
          return false;
        }
      }),
    },
    protectedContentRegistry: {
      path: "artifacts/majalis/lib/content-ops/data/protected-content-registry.json",
      present: existsSync(
        join(ROOT, "artifacts/majalis/lib/content-ops/data/protected-content-registry.json"),
      ),
    },
    measurementsNotTaken: [
      "full production bundle size (requires build artifact analysis — deferred to P4)",
      "cold/warm start on device",
      "TestFlight",
      "E2E full suite duration",
    ],
  };
}

function assertDocs() {
  const missing = [];
  for (const f of REQUIRED_DOCS) {
    if (WRITE && f === "baseline.json") continue;
    if (!existsSync(join(DOCS, f))) missing.push(f);
  }
  if (missing.length) {
    throw new Error(`مستندات P0 ناقصة: ${missing.join(", ")}`);
  }
}

function assertProtectedRegistry() {
  const path = join(
    ROOT,
    "artifacts/majalis/lib/content-ops/data/protected-content-registry.json",
  );
  if (!existsSync(path)) {
    throw new Error("سجل المحتوى المحمي مفقود");
  }
  const reg = JSON.parse(readFileSync(path, "utf8"));
  const entities = reg.entities || reg.items || [];
  if (!Array.isArray(entities) || entities.length < 5) {
    throw new Error("سجل المحتوى المحمي ضعيف أو فارغ");
  }
  const blob = JSON.stringify(reg);
  for (const needle of ["quran", "hadith", "adhkar"]) {
    if (!blob.toLowerCase().includes(needle)) {
      throw new Error(`سجل المحتوى المحمي لا يذكر: ${needle}`);
    }
  }
}

function assertNoDeletionManifestAbuse() {
  // P0 must not ship a mass-delete list marked approved without evidence
  const candidates = join(DOCS, "removal-candidates.json");
  if (!existsSync(candidates)) return;
  const data = JSON.parse(readFileSync(candidates, "utf8"));
  if (data.approvedForDeletion === true && !(data.evidenceComplete === true)) {
    throw new Error("removal-candidates.json معلّم للحذف دون اكتمال الأدلة");
  }
}

function main() {
  mkdirSync(DOCS, { recursive: true });
  assertDocs();
  assertProtectedRegistry();
  assertNoDeletionManifestAbuse();

  if (WRITE) {
    const baseline = collectBaseline();
    writeFileSync(join(DOCS, "baseline.json"), JSON.stringify(baseline, null, 2) + "\n");
    console.log("Wrote docs/cleanup/baseline.json");
    if (!baseline.qualityBaseline.typecheckPass || !baseline.qualityBaseline.lintPass) {
      console.error("Baseline quality failed (typecheck/lint)");
      process.exit(1);
    }
  } else {
    const baseline = JSON.parse(readFileSync(join(DOCS, "baseline.json"), "utf8"));
    if (baseline.brand !== "سُنّة") {
      throw new Error("baseline brand must be سُنّة");
    }
    if (!baseline.protectedContentRegistry?.present) {
      throw new Error("baseline missing protected registry flag");
    }
  }

  console.log("cleanup P0 gate: PASS (سُنّة)");
}

try {
  main();
} catch (e) {
  console.error("cleanup P0 gate: FAIL —", e instanceof Error ? e.message : e);
  process.exit(1);
}
