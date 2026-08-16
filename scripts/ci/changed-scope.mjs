#!/usr/bin/env node
/**
 * تصنيف نطاق الملفات المتغيّرة لـ CI الانتقائي.
 * يعمل بـ Node الصرف (بدون tsx) داخل classify job.
 *
 * scopes: content/data | ui/layout | quran/mushaf | backend/api | ci/config | ios/capacitor | docs | other
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const SCOPE_LABELS = {
  content_data: "content/data",
  ui_layout: "ui/layout",
  quran_mushaf: "quran/mushaf",
  backend_api: "backend/api",
  ci_config: "ci/config",
  ios_capacitor: "ios/capacitor",
  docs: "docs",
  other: "other",
};

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function listChangedFiles() {
  const fromEnv = (process.env.CI_CHANGED_FILES || "").trim();
  if (fromEnv) return fromEnv.split(/\n+/).map((s) => s.trim()).filter(Boolean);

  const base = arg("--base", process.env.CI_BASE_SHA || "");
  const head = arg("--head", process.env.CI_HEAD_SHA || "HEAD");
  try {
    if (base) {
      return execFileSync("git", ["diff", "--name-only", `${base}...${head}`], {
        cwd: ROOT,
        encoding: "utf8",
      })
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const mb = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
    return execFileSync("git", ["diff", "--name-only", `${mb}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** @param {string} p */
export function classifyPath(p) {
  const s = String(p || "").replace(/\\/g, "/");
  if (/^docs\//i.test(s) || /\.md$/i.test(s)) return "docs";
  if (
    /capacitor/i.test(s) ||
    /^ios\//i.test(s) ||
    /^artifacts\/majalis\/ios\//i.test(s) ||
    /android/i.test(s)
  ) {
    return "ios_capacitor";
  }
  if (
    /^\.github\//i.test(s) ||
    /^scripts\/(verify|ci)\//i.test(s) ||
    /^scripts\/verify-/i.test(s) ||
    /^package\.json$/i.test(s) ||
    /^pnpm-lock\.yaml$/i.test(s)
  ) {
    return "ci_config";
  }
  if (
    /^supabase\//i.test(s) ||
    /^artifacts\/majalis\/(api|lib\/api)/i.test(s) ||
    /^artifacts\/api-server\//i.test(s) ||
    /\.sql$/i.test(s) ||
    /migration/i.test(s)
  ) {
    return "backend_api";
  }
  if (
    /mushaf|quran-import|\bqpc\b|qpc-v2/i.test(s) ||
    /\/quran\//i.test(s) ||
    /public\/fonts\/qpc/i.test(s) ||
    /public\/data\/quran/i.test(s)
  ) {
    return "quran_mushaf";
  }
  if (
    /^artifacts\/majalis\/(public\/data|data)\//i.test(s) ||
    (/prophets|stories|adhkar|hadith|fawaid|rulings/i.test(s) &&
      /\.(json|jsonl|ts|tsx|md)$/i.test(s))
  ) {
    return "content_data";
  }
  if (
    /\.css$/i.test(s) ||
    /\/(components|pages|views|styles|design-system)\//i.test(s) ||
    /^artifacts\/majalis\/src\//i.test(s)
  ) {
    return "ui_layout";
  }
  return "other";
}

/** @param {string[]} paths */
export function classifyScopes(paths) {
  const scopes = new Set();
  /** @type {Record<string, string>} */
  const byPath = {};
  for (const p of paths) {
    const id = classifyPath(p);
    scopes.add(id);
    byPath[p] = id;
  }
  const list = [...scopes];
  const has = (id) => scopes.has(id);

  const need_build =
    has("ui_layout") ||
    has("quran_mushaf") ||
    has("content_data") ||
    has("backend_api") ||
    has("ci_config") ||
    has("ios_capacitor") ||
    has("other") ||
    paths.length === 0;

  const need_mushaf = has("quran_mushaf") || paths.length === 0;
  const need_color_contrast = has("ui_layout") || has("quran_mushaf") || paths.length === 0;
  const need_data_audit = has("content_data") || paths.length === 0;
  const need_admin_privacy = has("ui_layout") || has("ci_config") || has("content_data");
  const admin_only =
    list.length > 0 &&
    paths.every((p) => /\/admin\//i.test(p) || /seo-routes\.json$/i.test(p));

  return {
    scopes: list.map((id) => SCOPE_LABELS[id]),
    scopeIds: list,
    byPath,
    paths,
    outputs: {
      scopes: list.map((id) => SCOPE_LABELS[id]).join(","),
      scope_need_build: need_build ? "true" : "false",
      scope_need_mushaf: need_mushaf ? "true" : "false",
      scope_need_color_contrast: need_color_contrast ? "true" : "false",
      scope_need_data_audit: need_data_audit ? "true" : "false",
      scope_need_admin_privacy: need_admin_privacy ? "true" : "false",
      scope_admin_only: admin_only ? "true" : "false",
    },
  };
}

function main() {
  const paths = listChangedFiles();
  const result = classifyScopes(paths);
  const json = process.argv.includes("--json");

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("changed-scope:");
    console.log(
      JSON.stringify({ scopes: result.scopes, files: paths.length, outputs: result.outputs }, null, 2),
    );
  }

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    for (const [k, v] of Object.entries(result.outputs)) {
      appendFileSync(out, `${k}=${v}\n`);
    }
  } else if (!json) {
    writeFileSync(
      "/dev/stdout",
      Object.entries(result.outputs)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
    );
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
