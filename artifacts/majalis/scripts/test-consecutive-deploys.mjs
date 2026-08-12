#!/usr/bin/env node
/**
 * محاكاة حقيقية لنشرين متتاليين: يبني dist/version.json مرتين بمعرّفَي
 * commit مزيَّفين مختلفين (بلا تشغيل vite build كاملًا مرتين — بطيء)،
 * ويتحقّق أن اسم كاش الـService Worker يختلف فعليًا بين النشرتين، أي أن
 * النشرة الثانية تُبطل كاش الأولى تلقائيًا بلا أي خطوة يدوية.
 *
 * التشغيل: node scripts/test-consecutive-deploys.mjs (بعد pnpm run build مرة واحدة)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appRoot, "dist");
const genScript = resolve(appRoot, "scripts", "generate-version.mjs");

async function runDeploy(fakeCommit) {
  execSync(`node "${genScript}"`, {
    cwd: appRoot,
    env: { ...process.env, VERCEL_GIT_COMMIT_SHA: fakeCommit },
    stdio: "pipe",
  });
  const version = JSON.parse(await readFile(resolve(distDir, "version.json"), "utf8"));
  const swVersion = await readFile(resolve(distDir, "sw-version.js"), "utf8");
  return { version, swVersion };
}

const deploy1 = await runDeploy("1111111111111111111111111111111111111111");
const deploy2 = await runDeploy("2222222222222222222222222222222222222222");

const failures = [];
if (deploy1.version.shortCommit === deploy2.version.shortCommit) {
  failures.push("version.json: لم يتغيّر commit بين النشرتين المحاكاتين");
}
if (deploy1.swVersion === deploy2.swVersion) {
  failures.push("sw-version.js: لم يتغيّر SW_BUILD_ID بين النشرتين — الكاش لن يُبطَل");
}
const cache1 = deploy1.swVersion.match(/["']([a-f0-9]+)["']/i)?.[1];
const cache2 = deploy2.swVersion.match(/["']([a-f0-9]+)["']/i)?.[1];
if (!cache1 || !cache2 || cache1 === cache2) {
  failures.push("اسم كاش SHELL_CACHE/DATA_CACHE الفعلي متطابق بين النشرتين — عطل حقيقي لو حدث");
}

// أعد التوليد بمعرّف البناء الحقيقي الحالي حتى لا يبقى dist/ بمعرّفات مزيَّفة
execSync(`node "${genScript}"`, { cwd: appRoot, stdio: "pipe" });

if (failures.length > 0) {
  console.error("❌ فشل محاكاة نشرين متتاليين:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log(
  `✓ نشران متتاليان محاكاتان: كاش النشرة الأولى (${cache1}) يختلف فعليًا عن الثانية (${cache2}) — إبطال تلقائي مؤكَّد.`,
);
