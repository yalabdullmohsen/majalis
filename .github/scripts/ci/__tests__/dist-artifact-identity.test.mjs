/**
 * Governance tests for build-once dist artifact identity.
 * node --test .github/scripts/ci/__tests__/dist-artifact-identity.test.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  ARTIFACT_SCHEMA_VERSION,
  MANIFEST_FILENAME,
  SOURCE_FINGERPRINT_EXCLUDES,
  SOURCE_FINGERPRINT_GLOBS,
  assertDistArtifactManifest,
  computeLocalSourceFingerprint,
  createDistArtifactManifest,
  formatMismatchTable,
  readDistArtifactManifest,
  resolveCanonicalSourceSha,
  validateManifestShape,
  writeDistArtifactManifest,
} from "../dist-artifact-identity.mjs";

describe("resolveCanonicalSourceSha", () => {
  it("prefers checked-out SHA over PR head and github.sha (no head/merge mix)", () => {
    const sha = resolveCanonicalSourceSha({
      eventName: "pull_request",
      prHeadSha: "aaa_pr_head",
      githubSha: "bbb_merge",
      checkedOutSha: "ccc_checkout",
    });
    assert.equal(sha, "ccc_checkout");
  });

  it("on pull_request without checkout uses github.sha (merge) not pr head alone", () => {
    const sha = resolveCanonicalSourceSha({
      eventName: "pull_request",
      prHeadSha: "aaa_pr_head",
      githubSha: "bbb_merge",
    });
    assert.equal(sha, "bbb_merge");
  });

  it("on push uses github.sha", () => {
    assert.equal(
      resolveCanonicalSourceSha({ eventName: "push", githubSha: "push_sha" }),
      "push_sha",
    );
  });
});

describe("manifest schema", () => {
  const base = {
    sourceSha: "abc123",
    sourceFingerprint: "fp1",
    repository: "yalabdullmohsen/majalis",
    workflowRunId: "111",
    workflowRunAttempt: "1",
    producerJob: "build",
  };

  it("creates schema v1 with required fields and compat aliases", () => {
    const m = createDistArtifactManifest(base);
    assert.equal(m.schemaVersion, ARTIFACT_SCHEMA_VERSION);
    assert.equal(m.sourceSha, "abc123");
    assert.equal(m.sha, "abc123");
    assert.equal(m.src_fingerprint, "fp1");
    assert.equal(m.producer, "build");
  });

  it("rejects incomplete or unsupported schema", () => {
    assert.equal(validateManifestShape(null).ok, false);
    assert.equal(validateManifestShape({ schemaVersion: 99, ...base }).ok, false);
    assert.equal(validateManifestShape({ schemaVersion: 1, sourceSha: "" }).ok, false);
  });

  it("accepts matching manifest and prints clear field table on mismatch", () => {
    const m = createDistArtifactManifest(base);
    const ok = assertDistArtifactManifest(m, base);
    assert.equal(ok.ok, true);

    const bad = assertDistArtifactManifest(m, { ...base, sourceSha: "other", workflowRunId: "222" });
    assert.equal(bad.ok, false);
    const table = formatMismatchTable(bad.rows);
    assert.match(table, /^field \| expected \| actual/m);
    assert.match(table, /sourceSha \| other \| abc123/);
    assert.match(table, /workflowRunId \| 222 \| 111/);
  });

  it("rejects artifact from a previous run id", () => {
    const m = createDistArtifactManifest(base);
    const r = assertDistArtifactManifest(m, { ...base, workflowRunId: "999" });
    assert.equal(r.ok, false);
    assert.ok(r.rows.some((row) => row.field === "workflowRunId"));
  });

  it("rejects artifact from a previous run attempt", () => {
    const m = createDistArtifactManifest({ ...base, workflowRunAttempt: "1" });
    const r = assertDistArtifactManifest(m, { ...base, workflowRunAttempt: "2" });
    assert.equal(r.ok, false);
    assert.ok(r.rows.some((row) => row.field === "workflowRunAttempt"));
  });
});

describe("source fingerprint determinism", () => {
  it("globs exclude dist/cache/logs and include source trees", () => {
    const joined = SOURCE_FINGERPRINT_GLOBS.join("\n");
    assert.match(joined, /artifacts\/majalis\/src\/\*\*/);
    assert.doesNotMatch(joined, /artifacts\/majalis\/dist/);
    assert.ok(SOURCE_FINGERPRINT_EXCLUDES.some((x) => x.includes("dist")));
    assert.ok(SOURCE_FINGERPRINT_EXCLUDES.some((x) => x.includes(".cache")));
    assert.ok(SOURCE_FINGERPRINT_EXCLUDES.some((x) => x.includes("logs")));
  });

  it("producer/consumer local fingerprint matches for same tree", () => {
    const root = mkdtempSync(join(tmpdir(), "dist-fp-"));
    try {
      mkdirSync(join(root, "artifacts/majalis/src"), { recursive: true });
      writeFileSync(join(root, "pnpm-lock.yaml"), "lock: 1\n");
      writeFileSync(join(root, "artifacts/majalis/package.json"), "{\"name\":\"majalis\"}\n");
      writeFileSync(join(root, "artifacts/majalis/vite.config.ts"), "export default {}\n");
      writeFileSync(join(root, "artifacts/majalis/index.html"), "<html></html>\n");
      writeFileSync(join(root, "artifacts/majalis/src/a.ts"), "export const a=1\n");
      const producer = computeLocalSourceFingerprint(root);
      const consumer = computeLocalSourceFingerprint(root);
      assert.equal(producer, consumer);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("changing a source file changes the fingerprint", () => {
    const root = mkdtempSync(join(tmpdir(), "dist-fp-chg-"));
    try {
      mkdirSync(join(root, "artifacts/majalis/src"), { recursive: true });
      writeFileSync(join(root, "pnpm-lock.yaml"), "lock: 1\n");
      writeFileSync(join(root, "artifacts/majalis/package.json"), "{\"name\":\"majalis\"}\n");
      writeFileSync(join(root, "artifacts/majalis/vite.config.ts"), "export default {}\n");
      writeFileSync(join(root, "artifacts/majalis/index.html"), "<html></html>\n");
      writeFileSync(join(root, "artifacts/majalis/src/a.ts"), "export const a=1\n");
      const before = computeLocalSourceFingerprint(root);
      writeFileSync(join(root, "artifacts/majalis/src/a.ts"), "export const a=2\n");
      const after = computeLocalSourceFingerprint(root);
      assert.notEqual(before, after);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("changing dist/cache/log does not change the fingerprint", () => {
    const root = mkdtempSync(join(tmpdir(), "dist-fp-noise-"));
    try {
      mkdirSync(join(root, "artifacts/majalis/src"), { recursive: true });
      writeFileSync(join(root, "pnpm-lock.yaml"), "lock: 1\n");
      writeFileSync(join(root, "artifacts/majalis/package.json"), "{\"name\":\"majalis\"}\n");
      writeFileSync(join(root, "artifacts/majalis/vite.config.ts"), "export default {}\n");
      writeFileSync(join(root, "artifacts/majalis/index.html"), "<html></html>\n");
      writeFileSync(join(root, "artifacts/majalis/src/a.ts"), "export const a=1\n");
      const before = computeLocalSourceFingerprint(root);

      mkdirSync(join(root, "artifacts/majalis/dist"), { recursive: true });
      writeFileSync(join(root, "artifacts/majalis/dist/index.html"), "built\n");
      mkdirSync(join(root, ".cache"), { recursive: true });
      writeFileSync(join(root, ".cache/x"), "cache\n");
      mkdirSync(join(root, "logs"), { recursive: true });
      writeFileSync(join(root, "logs/ci.log"), "log\n");

      const after = computeLocalSourceFingerprint(root);
      assert.equal(before, after);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("write/read manifest file", () => {
  it("writes non-hidden ci-artifact.json and assert accepts it", () => {
    const dist = mkdtempSync(join(tmpdir(), "dist-manif-"));
    try {
      const fields = {
        sourceSha: "deadbeef",
        sourceFingerprint: "fpdead",
        repository: "yalabdullmohsen/majalis",
        workflowRunId: "42",
        workflowRunAttempt: "1",
        producerJob: "build",
      };
      const { out } = writeDistArtifactManifest(dist, fields);
      assert.equal(out.endsWith(MANIFEST_FILENAME), true);
      assert.equal(existsSync(join(dist, MANIFEST_FILENAME)), true);
      assert.equal(existsSync(join(dist, ".ci-artifact.json")), false);

      const loaded = readDistArtifactManifest(dist);
      assert.ok(loaded.manifest);
      const result = assertDistArtifactManifest(loaded.manifest, fields);
      assert.equal(result.ok, true);
      // ensure JSON is valid UTF-8 text
      JSON.parse(readFileSync(out, "utf8"));
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });
});
