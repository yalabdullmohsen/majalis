/**
 * TOTAL TRUST Phase 4 — حديث / تفسير / SEO (قراءة مصدر + بوابة).
 * تشغيل: node --import tsx src/lib/__tests__/total-trust-phase4-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");

function run(cmd: string, args: string[], cwd: string) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return r;
}

assert.ok(existsSync(resolve(repoRoot, "scripts/total-trust-hadith-tafsir.mjs")));
run("node", ["scripts/total-trust-hadith-tafsir.mjs"], repoRoot);

const p4 = JSON.parse(
  readFileSync(resolve(repoRoot, "reports/total-trust/phase4-hadith-tafsir.json"), "utf8"),
) as {
  phase: number;
  offlineBannerGlobal: boolean;
  auditedRoutes: number;
  needsReview: string[];
  redirects: Array<{ route: string; to: string; proven: boolean }>;
  findings: Array<{ code: string; route: string }>;
};

assert.equal(p4.phase, 4);
assert.ok(p4.offlineBannerGlobal);
assert.ok(p4.auditedRoutes >= 12);
assert.equal(p4.needsReview.length, 0, `needsReview=${p4.needsReview.join(",")}`);
assert.equal(p4.findings.length, 0, `findings=${p4.findings.map((f) => f.route).join(",")}`);
assert.ok(p4.redirects.every((r) => r.proven));
assert.ok(p4.redirects.some((r) => r.route === "/hadith/arbaeen" && r.to === "/arbaeen-nawawi"));
assert.ok(p4.redirects.some((r) => r.route === "/quran/tafsir" && r.to === "/tafsir"));

const seo = JSON.parse(readFileSync(resolve(majalisRoot, "src/lib/seo-routes.json"), "utf8")) as {
  routes: Array<{ path: string; description?: string }>;
};
const love = seo.routes.find((r) => r.path === "/hadith/arbaeen-love-of-allah");
assert.ok(love?.description && love.description.length >= 80);

const lovePage = readFileSync(resolve(majalisRoot, "src/views/ArbaeenLovePage.tsx"), "utf8");
assert.match(lovePage, /STATUS\.networkError/);
assert.match(lovePage, /EMPTY\.data/);

const docs = readFileSync(resolve(repoRoot, "docs/content-quality/TOTAL_TRUST_PHASE4.md"), "utf8");
assert.match(docs, /المرحلة 4/);
assert.match(docs, /حديث/);
assert.match(docs, /تفسير/);
assert.match(docs, /OWNER_DECISION/);

console.log("total-trust-phase4-gate.test.ts: ok");
