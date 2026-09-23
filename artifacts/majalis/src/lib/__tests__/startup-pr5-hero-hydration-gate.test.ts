/**
 * بوابة Startup PR-5: Hero hydration مستقر — بلا ٠٪ قبل الاستعادة + شرائح ثابتة.
 * تشغيل: node --import tsx src/lib/__tests__/startup-pr5-hero-hydration-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const hero = readPkg("src/components/home/HomeHeroLcp.tsx");
assert.match(hero, /mj:boot-ready|mj:feature-tour-storage-ready/);
assert.match(hero, /invalidateLastPageMemCache/);
assert.match(hero, /heroStorageLooksReady|getBootFlags/);
assert.match(hero, /تقدم —٪|الورد —\//);
assert.match(hero, /hw3-primary/);
assert.match(hero, /hw3-meta__ph|aria-busy/);
assert.doesNotMatch(
  hero,
  /const \[welcome\] = useState\(\(\) => readWelcomeSnapshot\(\)\)/,
);
assert.doesNotMatch(
  hero,
  /\(welcome\.continueLabel \|\| \(welcome\.mushafPage/,
);

const lastPage = readPkg("src/lib/quran-last-page.ts");
assert.match(lastPage, /export function invalidateLastPageMemCache/);

const native = readPkg("src/lib/native-storage.ts");
assert.match(native, /majalis-daily-progress-v1/);
assert.match(native, /invalidateLastPageMemCache/);

const daily = readPkg("src/lib/daily-progress.ts");
assert.match(daily, /storageSetSync/);

const css = readPkg("src/styles/sunnah-identity-home-hub.css");
assert.match(css, /\.hw3-primary[\s\S]*min-height:\s*2\.5rem/);
assert.match(css, /\.hw3-meta[\s\S]*min-height:\s*1\.35rem/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:startup-pr5"/);
assert.match(pkg, /test:startup-pr5/);

assert.match(readRepo("docs/REPO_INDEX.md"), /Startup PR-5|startup-pr5|Hero hydration/);

const report = readRepo("docs/performance/STARTUP_ROOT_CAUSE_REPORT.md");
assert.match(report, /Hero hydration مستقر|PR-5/);

console.log("startup-pr5-hero-hydration-gate.test.ts: ok");
