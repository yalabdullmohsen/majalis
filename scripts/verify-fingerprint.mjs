#!/usr/bin/env node
/**
 * بصمة محلية لـ verify:ci / hooks — تمنع إعادة الفحص الثقيل بلا تغيّر المدخلات.
 *
 * المدخلات: HEAD + porcelain diff + pnpm-lock + configs الحساسة.
 * التخزين: .cache/majalis-verify/<sha>.json (غير متتبَّع).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = resolve(ROOT, ".cache/majalis-verify");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function fileHash(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return `${rel}:missing`;
  return `${rel}:${createHash("sha256").update(readFileSync(p)).digest("hex")}`;
}

/** @returns {string} */
export function computeVerifyFingerprint() {
  const head = git(["rev-parse", "HEAD"]) || "nohead";
  const porcelain = git(["status", "--porcelain"]) || "";
  const staged = git(["diff", "--cached", "--name-only"]) || "";
  const unstaged = git(["diff", "--name-only"]) || "";
  const parts = [
    `head=${head}`,
    `porcelain=${porcelain}`,
    `staged=${staged}`,
    `unstaged=${unstaged}`,
    fileHash("pnpm-lock.yaml"),
    fileHash("package.json"),
    fileHash("artifacts/majalis/package.json"),
    fileHash("artifacts/majalis/vite.config.ts"),
    fileHash(".github/workflows/ci.yml"),
    fileHash(".github/scripts/safe-auto-merge/path-classifier.mjs"),
  ];
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

function cachePath(fp, kind) {
  return resolve(CACHE_DIR, `${kind}-${fp}.json`);
}

/**
 * @param {string} kind  e.g. verify-ci | preflight | build
 * @returns {{ hit: boolean, fingerprint: string, record?: object }}
 */
export function readVerifyCache(kind = "verify-ci") {
  const fingerprint = computeVerifyFingerprint();
  const p = cachePath(fingerprint, kind);
  if (!existsSync(p)) return { hit: false, fingerprint };
  try {
    const record = JSON.parse(readFileSync(p, "utf8"));
    if (record?.ok === true && record?.kind === kind && record?.fingerprint === fingerprint) {
      return { hit: true, fingerprint, record };
    }
  } catch {
    /* miss */
  }
  return { hit: false, fingerprint };
}

/**
 * @param {string} kind
 * @param {{ seconds?: number, note?: string }} [meta]
 */
export function writeVerifyCache(kind, meta = {}) {
  const fingerprint = computeVerifyFingerprint();
  mkdirSync(CACHE_DIR, { recursive: true });
  const record = {
    ok: true,
    kind,
    fingerprint,
    at: new Date().toISOString(),
    head: git(["rev-parse", "HEAD"]) || "",
    seconds: meta.seconds ?? null,
    note: meta.note ?? "",
  };
  writeFileSync(cachePath(fingerprint, kind), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

export function clearVerifyCache() {
  // no-op helper kept for API stability
}

function main() {
  const cmd = process.argv[2] || "print";
  if (cmd === "print") {
    console.log(computeVerifyFingerprint());
    return;
  }
  if (cmd === "check") {
    const kind = process.argv[3] || "verify-ci";
    const r = readVerifyCache(kind);
    if (r.hit) {
      console.log(`HIT kind=${kind} fp=${r.fingerprint.slice(0, 12)}…`);
      process.exit(0);
    }
    console.log(`MISS kind=${kind} fp=${r.fingerprint.slice(0, 12)}…`);
    process.exit(1);
  }
  if (cmd === "write") {
    const kind = process.argv[3] || "verify-ci";
    const rec = writeVerifyCache(kind);
    console.log(`WROTE kind=${kind} fp=${rec.fingerprint.slice(0, 12)}…`);
    return;
  }
  console.error("usage: verify-fingerprint.mjs [print|check <kind>|write <kind>]");
  process.exit(2);
}

if (process.argv[1] && process.argv[1].endsWith("verify-fingerprint.mjs")) {
  main();
}
