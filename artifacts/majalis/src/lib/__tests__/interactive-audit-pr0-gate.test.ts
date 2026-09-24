/**
 * بوابة PR-0: جرد تفاعلي ساكن + عقود وضع عرض المصحف (بلا أرقام runtime مخترعة).
 * node --import tsx src/lib/__tests__/interactive-audit-pr0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyMushafAppearanceMode,
  loadMushafAppearanceMode,
  resolveMushafAppearance,
  saveMushafAppearanceMode,
} from "@/lib/mushaf-v2/appearance-prefs";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== PR-0 artifacts exist ===");
assert.ok(existsSync(resolve(repoRoot, "docs/qa/INTERACTIVE_ELEMENTS_AUDIT.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/qa/interactive-static-findings.json")));
assert.ok(existsSync(resolve(repoRoot, "docs/qa/interactive-routes-registry.json")));
assert.ok(existsSync(resolve(majalisRoot, "scripts/interactive-elements-static-audit.mjs")));

const findings = JSON.parse(readRepo("docs/qa/interactive-static-findings.json")) as {
  routesFromRegistry: number;
  runtimeStatus: string;
  staticFindings: Record<string, number>;
};
assert.equal(findings.runtimeStatus, "NOT_MEASURED");
assert.ok(findings.routesFromRegistry >= 300, "registry routes expected ≥300");
assert.equal(findings.staticFindings.hrefHash, 0);
assert.equal(findings.staticFindings.emptyOnClick, 0);
assert.equal(findings.staticFindings.javascriptHref, 0);

const audit = readRepo("docs/qa/INTERACTIVE_ELEMENTS_AUDIT.md");
assert.match(audit, /PR-0/);
assert.match(audit, /NOT_MEASURED/);
assert.match(audit, /Program status:\*\* `PARTIAL`|\*\*Program status:\*\* `PARTIAL`/);
assert.match(audit, /SYSTEM/);
assert.match(audit, /لا يُعلن.*SUNNAH_ALL_INTERACTIONS_VERIFIED|ممنوع حتى PR-10/);
assert.doesNotMatch(audit, /Program status:\*\* `COMPLETE`|\*\*Program status:\*\* `COMPLETE`/);

console.log("=== Display mode store → DOM (no remount key) ===");
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => {
    mem.set(k, v);
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;

const attrs = new Map<string, string>();
const nmRoot = {
  setAttribute: (k: string, v: string) => {
    attrs.set(`nm:${k}`, v);
  },
  getAttribute: (k: string) => attrs.get(`nm:${k}`) ?? null,
};
const htmlAttrs = new Map<string, string>();
(globalThis as { document?: unknown; window?: unknown }).document = {
  documentElement: {
    setAttribute: (k: string, v: string) => {
      htmlAttrs.set(k, v);
    },
    getAttribute: (k: string) => htmlAttrs.get(k) ?? null,
  },
  querySelectorAll: () => [nmRoot],
};
(globalThis as { window?: unknown }).window = {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  dispatchEvent: () => true,
};

saveMushafAppearanceMode("DARK");
assert.equal(mem.get("ssunnah-mushaf-appearance-v1"), "DARK");
assert.equal(loadMushafAppearanceMode(), "DARK");
assert.equal(resolveMushafAppearance("DARK"), "night");
applyMushafAppearanceMode("DARK");
assert.equal(htmlAttrs.get("data-mushaf-appearance"), "night");
assert.equal(attrs.get("nm:data-mushaf-appearance"), "night");

saveMushafAppearanceMode("LIGHT");
assert.equal(htmlAttrs.get("data-mushaf-appearance"), "light");
assert.equal(resolveMushafAppearance("LIGHT"), "light");

saveMushafAppearanceMode("SYSTEM");
assert.equal(mem.get("ssunnah-mushaf-appearance-v1"), "SYSTEM");

const newReader = readPkg("src/features/mushaf-reader/NewMushafReader.tsx");
assert.doesNotMatch(newReader, /key=\{[^}]*([Aa]ppearance|[Dd]isplayMode|[Tt]hemeChoice)/);
assert.match(newReader, /ssunnah:mushaf-appearance-change|"SYSTEM"/);

const verified = readPkg("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
assert.match(verified, /themeChoice|data-mushaf-theme/, "legacy dual theme still present — PR-1 risk");

console.log("interactive-audit-pr0-gate.test.ts: ok");
