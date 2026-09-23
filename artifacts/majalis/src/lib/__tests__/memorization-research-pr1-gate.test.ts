/**
 * بوابة PR-1: Routes + AppPage + Nav لمسار الحفظ خلف Flags OFF.
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const appRoutes = readPkg("src/AppRoutes.tsx");
assert.match(appRoutes, /path="\/hifz-path"/);
assert.match(appRoutes, /path="\/hifz-path\/my"/);
assert.match(appRoutes, /HifzPathPage/);
assert.match(appRoutes, /path="\/scholarly-research"><Redirect to="\/academic-research"/);

const vercel = readPkg("vercel.json");
assert.match(
  vercel,
  /"source":\s*"\/scholarly-research"[\s\S]*?"destination":\s*"\/academic-research"/,
);

const routes = readPkg("src/app/router/routes.ts");
assert.match(routes, /"\/hifz-path"/);
assert.match(routes, /hifz-path\)\(\\\/\|\$\)/);

const navVis = readPkg("src/lib/nav-visibility.ts");
assert.match(navVis, /"\/hifz-path"/);

const registry = readPkg("src/lib/feature-registry.ts");
assert.match(registry, /id:\s*"hifz-path"/);
assert.match(registry, /coming-soon/);

const page = readPkg("src/pages/hifz-path/HifzPathPage.tsx");
assert.match(page, /isHifzPathEnabled/);
assert.match(page, /Redirect to="\/memorization"/);
assert.match(page, /PageHeaderV2|SectionTemplatePage/);
assert.match(page, /HIFZ_PATH_USER_TAGLINE/);
assert.doesNotMatch(page, /كل ما يجب على المسلم حفظه/);

const {
  isHifzPathEnabled,
  getHifzPathNavEntry,
  resetMemorizationResearchFlags,
  setMemorizationResearchFlagsForTests,
} = await import("../memorization-path/index.ts");

resetMemorizationResearchFlags();
assert.equal(isHifzPathEnabled(), false);
assert.equal(getHifzPathNavEntry(), null);
setMemorizationResearchFlagsForTests({ hifzPathEnabled: true });
assert.equal(isHifzPathEnabled(), true);
assert.equal(getHifzPathNavEntry()?.href, "/hifz-path");
resetMemorizationResearchFlags();

const orphan = readPkg("scripts/orphan-discovery-allowlist.json");
assert.match(orphan, /"\/hifz-path"/);
assert.match(orphan, /"\/hifz-path\/my"/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr1"/);

assert.match(readRepo("docs/REPO_INDEX.md"), /hifz-path|مسار الحفظ.*PR-1|memorization-research-pr1/);
assert.match(readRepo("docs/memorization-research/PR0_CONTRACTS.md"), /\/academic-research/);

console.log("memorization-research-pr1-gate.test.ts: ok");
