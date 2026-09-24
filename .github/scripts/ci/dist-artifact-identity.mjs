/**
 * Canonical build-once dist artifact identity (producer + consumers).
 *
 * Contract:
 * - sourceSha = git rev-parse HEAD after the same checkout used to build/fingerprint
 * - sourceFingerprint = deterministic hash of source inputs (never dist/cache/logs)
 * - manifest is a non-hidden file so upload-artifact v4 includes it by default
 *
 * CLI:
 *   node .github/scripts/ci/dist-artifact-identity.mjs write --out <path> ...
 *   node .github/scripts/ci/dist-artifact-identity.mjs assert --manifest <path> ...
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ARTIFACT_SCHEMA_VERSION = 1;
/** Non-hidden — upload-artifact v4 excludes dotfiles unless include-hidden-files=true */
export const MANIFEST_FILENAME = "ci-artifact.json";
/** Legacy path from early build-once rollout (hidden → often dropped from artifact zip) */
export const LEGACY_MANIFEST_FILENAME = ".ci-artifact.json";

/**
 * Source inputs mirrored by CI `hashFiles(...)`.
 * Must NOT include dist, caches, logs, reports, or untracked build outputs.
 */
export const SOURCE_FINGERPRINT_GLOBS = Object.freeze([
  "pnpm-lock.yaml",
  "artifacts/majalis/package.json",
  "artifacts/majalis/vite.config.ts",
  "artifacts/majalis/tsconfig*.json",
  "artifacts/majalis/src/**",
  "artifacts/majalis/lib/**",
  "artifacts/majalis/public/**",
  "artifacts/majalis/index.html",
  "artifacts/majalis/scripts/**",
]);

export const SOURCE_FINGERPRINT_EXCLUDES = Object.freeze([
  "artifacts/majalis/dist",
  "artifacts/majalis/dist/**",
  "**/node_modules/**",
  "**/.cache/**",
  "**/logs/**",
  "**/*.log",
  "reports/**",
  ".cache/**",
]);

/**
 * Resolve the only SHA stamped into the artifact.
 * Prefer the SHA of the tree that was actually checked out (never mix PR head + merge).
 *
 * @param {{ eventName?: string, prHeadSha?: string, githubSha?: string, checkedOutSha?: string }} input
 */
export function resolveCanonicalSourceSha(input = {}) {
  const checkedOut = String(input.checkedOutSha || "").trim();
  if (checkedOut) return checkedOut;

  const eventName = String(input.eventName || "");
  const prHead = String(input.prHeadSha || "").trim();
  const githubSha = String(input.githubSha || "").trim();

  // Without a checked-out SHA, never invent a PR-head identity while CI defaults to merge checkout.
  if (eventName === "pull_request" || eventName === "merge_group") {
    if (githubSha) return githubSha;
    if (prHead) return prHead;
  }
  return githubSha || prHead;
}

/**
 * @param {object} fields
 * @returns {object}
 */
export function createDistArtifactManifest(fields) {
  const sourceSha = String(fields.sourceSha || "").trim();
  const sourceFingerprint = String(fields.sourceFingerprint || "").trim();
  const repository = String(fields.repository || "").trim();
  const workflowRunId = String(fields.workflowRunId ?? "").trim();
  const workflowRunAttempt = String(fields.workflowRunAttempt ?? "").trim();
  const producerJob = String(fields.producerJob || "build").trim();

  if (!sourceSha) throw new Error("createDistArtifactManifest: sourceSha required");
  if (!sourceFingerprint) throw new Error("createDistArtifactManifest: sourceFingerprint required");
  if (!repository) throw new Error("createDistArtifactManifest: repository required");
  if (!workflowRunId) throw new Error("createDistArtifactManifest: workflowRunId required");
  if (!workflowRunAttempt) throw new Error("createDistArtifactManifest: workflowRunAttempt required");

  return {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    sourceSha,
    sourceFingerprint,
    repository,
    workflowRunId,
    workflowRunAttempt,
    producerJob,
    // Compat aliases consumed by older assert snippets during rollout
    sha: sourceSha,
    src_fingerprint: sourceFingerprint,
    producer: producerJob,
  };
}

/**
 * @param {unknown} manifest
 * @returns {{ ok: boolean, error?: string, rows: Array<{ field: string, expected: string, actual: string }> }}
 */
export function validateManifestShape(manifest) {
  const rows = [];
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, error: "manifest missing or not an object", rows };
  }
  const m = /** @type {Record<string, unknown>} */ (manifest);
  const version = Number(m.schemaVersion);
  if (!Number.isInteger(version) || version < 1) {
    rows.push({
      field: "schemaVersion",
      expected: `>=1 integer`,
      actual: String(m.schemaVersion),
    });
    return { ok: false, error: "unsupported or missing schemaVersion", rows };
  }
  if (version > ARTIFACT_SCHEMA_VERSION) {
    rows.push({
      field: "schemaVersion",
      expected: `<=${ARTIFACT_SCHEMA_VERSION}`,
      actual: String(version),
    });
    return { ok: false, error: "unsupported schemaVersion", rows };
  }
  for (const key of [
    "sourceSha",
    "sourceFingerprint",
    "repository",
    "workflowRunId",
    "workflowRunAttempt",
    "producerJob",
  ]) {
    if (!String(m[key] ?? "").trim()) {
      rows.push({ field: key, expected: "non-empty", actual: String(m[key]) });
    }
  }
  if (rows.length) return { ok: false, error: "manifest incomplete", rows };
  return { ok: true, rows };
}

/**
 * Same-run build-once reuse across attempts.
 *
 * `gh run rerun --failed` re-runs failed consumers (e.g. lhci-home) while the
 * successful `build` producer is skipped, so consumers download the attempt-N
 * stamp with github.run_attempt = N+1. Require identical source identity +
 * workflowRunId, and allow stamped attempt <= consumer attempt.
 *
 * @param {string} actual
 * @param {string} expected
 * @returns {boolean}
 */
export function isCompatibleWorkflowRunAttempt(actual, expected) {
  const a = Number(String(actual ?? "").trim());
  const e = Number(String(expected ?? "").trim());
  if (!Number.isInteger(a) || !Number.isInteger(e) || a < 1 || e < 1) return false;
  return a <= e;
}

/**
 * @param {object|null|undefined} manifest
 * @param {object} expected
 */
export function assertDistArtifactManifest(manifest, expected) {
  const shape = validateManifestShape(manifest);
  const rows = [...shape.rows];
  if (!shape.ok) {
    return { ok: false, error: shape.error, rows };
  }

  const m = /** @type {Record<string, unknown>} */ (manifest);
  const checks = [
    ["sourceSha", expected.sourceSha],
    ["sourceFingerprint", expected.sourceFingerprint],
    ["repository", expected.repository],
    ["workflowRunId", String(expected.workflowRunId)],
    ["producerJob", expected.producerJob || "build"],
  ];

  for (const [field, want] of checks) {
    const actual = String(m[field] ?? "");
    const expectedVal = String(want ?? "");
    if (actual !== expectedVal) {
      rows.push({ field, expected: expectedVal, actual });
    }
  }

  const actualAttempt = String(m.workflowRunAttempt ?? "");
  const expectedAttempt = String(expected.workflowRunAttempt ?? "");
  if (!isCompatibleWorkflowRunAttempt(actualAttempt, expectedAttempt)) {
    rows.push({
      field: "workflowRunAttempt",
      expected: `<=${expectedAttempt} (same run reuse)`,
      actual: actualAttempt,
    });
  }

  if (rows.length) {
    return { ok: false, error: "dist artifact identity mismatch", rows };
  }
  return { ok: true, rows: [] };
}

/** @param {Array<{ field: string, expected: string, actual: string }>} rows */
export function formatMismatchTable(rows) {
  const lines = ["field | expected | actual"];
  for (const r of rows) {
    lines.push(`${r.field} | ${r.expected} | ${r.actual}`);
  }
  return lines.join("\n");
}

/**
 * Read manifest from dist dir (prefers non-hidden file).
 * @param {string} distDir
 */
export function readDistArtifactManifest(distDir) {
  const primary = resolve(distDir, MANIFEST_FILENAME);
  const legacy = resolve(distDir, LEGACY_MANIFEST_FILENAME);
  if (existsSync(primary)) {
    return { path: primary, manifest: JSON.parse(readFileSync(primary, "utf8")) };
  }
  if (existsSync(legacy)) {
    return { path: legacy, manifest: JSON.parse(readFileSync(legacy, "utf8")) };
  }
  return { path: primary, manifest: null };
}

/**
 * Local deterministic fingerprint for tests (not GitHub hashFiles).
 * Hashes sorted relative paths + contents under `root`, applying exclude prefixes.
 *
 * @param {string} root
 * @param {{ includePrefixes?: string[], excludePrefixes?: string[] }} [opts]
 */
export function computeLocalSourceFingerprint(root, opts = {}) {
  const includePrefixes = opts.includePrefixes || [
    "pnpm-lock.yaml",
    "artifacts/majalis/package.json",
    "artifacts/majalis/vite.config.ts",
    "artifacts/majalis/src/",
    "artifacts/majalis/lib/",
    "artifacts/majalis/public/",
    "artifacts/majalis/index.html",
    "artifacts/majalis/scripts/",
  ];
  const excludePrefixes = opts.excludePrefixes || [
    "artifacts/majalis/dist/",
    "node_modules/",
    ".cache/",
    "reports/",
    "logs/",
  ];

  /** @type {string[]} */
  const files = [];
  function walk(abs, rel) {
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(abs, ent.name);
      if (excludePrefixes.some((p) => childRel === p.replace(/\/$/, "") || childRel.startsWith(p))) {
        continue;
      }
      if (ent.isDirectory()) {
        walk(childAbs, childRel);
        continue;
      }
      if (!ent.isFile()) continue;
      const included = includePrefixes.some((p) => {
        if (p.endsWith("/")) return childRel.startsWith(p) || childRel + "/" === p;
        return childRel === p || childRel.startsWith(p.replace(/\*\*$/, ""));
      });
      // Also allow exact files and tsconfig*
      const isTsconfig = /^artifacts\/majalis\/tsconfig.*\.json$/.test(childRel);
      if (included || isTsconfig) files.push(childRel);
    }
  }
  walk(root, "");
  files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const h = createHash("sha256");
  for (const rel of files) {
    const body = readFileSync(join(root, rel));
    h.update(rel);
    h.update("\0");
    h.update(body);
    h.update("\0");
  }
  return h.digest("hex");
}

export function writeDistArtifactManifest(distDir, fields) {
  mkdirSync(distDir, { recursive: true });
  const manifest = createDistArtifactManifest(fields);
  const out = resolve(distDir, MANIFEST_FILENAME);
  writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
  return { out, manifest };
}

function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "1";
    out[key] = val;
  }
  return out;
}

function main(argv = process.argv.slice(2)) {
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  if (cmd === "write") {
    const distDir = resolve(args.out || args.dist || "artifacts/majalis/dist");
    const { out, manifest } = writeDistArtifactManifest(distDir, {
      sourceSha: args["source-sha"] || args.sourceSha,
      sourceFingerprint: args["source-fingerprint"] || args.sourceFingerprint,
      repository: args.repository,
      workflowRunId: args["run-id"] || args.workflowRunId,
      workflowRunAttempt: args["run-attempt"] || args.workflowRunAttempt,
      producerJob: args["producer-job"] || "build",
    });
    console.log(`wrote ${out}`);
    console.log(JSON.stringify(manifest));
    return;
  }

  if (cmd === "assert") {
    const distDir = resolve(args.dist || "artifacts/majalis/dist");
    const { path, manifest } = readDistArtifactManifest(distDir);
    if (!manifest) {
      const rows = [
        {
          field: "manifest",
          expected: `${MANIFEST_FILENAME} present`,
          actual: `missing (${MANIFEST_FILENAME} and ${LEGACY_MANIFEST_FILENAME})`,
        },
      ];
      console.error(formatMismatchTable(rows));
      console.error(`assert failed: missing dist artifact manifest at ${path}`);
      process.exit(1);
    }
    const result = assertDistArtifactManifest(manifest, {
      sourceSha: args["source-sha"] || args.sourceSha,
      sourceFingerprint: args["source-fingerprint"] || args.sourceFingerprint,
      repository: args.repository,
      workflowRunId: args["run-id"] || args.workflowRunId,
      workflowRunAttempt: args["run-attempt"] || args.workflowRunAttempt,
      producerJob: args["producer-job"] || "build",
    });
    if (!result.ok) {
      console.error(formatMismatchTable(result.rows));
      console.error(`assert failed: ${result.error}`);
      process.exit(1);
    }
    console.log("artifact stamp ok", { path, schemaVersion: manifest.schemaVersion, sourceSha: manifest.sourceSha });
    return;
  }

  console.error("usage: dist-artifact-identity.mjs <write|assert> [options]");
  process.exit(2);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
