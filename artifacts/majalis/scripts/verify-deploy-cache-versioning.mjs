#!/usr/bin/env node
/**
 * تحقّق آلي حقيقي (على dist/ الفعلي بعد كل بناء) من أن آلية إبطال الكاش
 * مربوطة فعليًا بمعرّف البناء، لا رقمًا يدويًا — يمنع رجوع بق "الكاش
 * القديم يبقى بعد النشر" الذي وُثِّق تفصيليًا في READY_FOR_MERGE.md.
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appRoot, "dist");

const failures = [];

const versionJson = JSON.parse(await readFile(resolve(distDir, "version.json"), "utf8"));
const swVersionJs = await readFile(resolve(distDir, "sw-version.js"), "utf8");
const swJs = await readFile(resolve(distDir, "sw.js"), "utf8");

if (!versionJson.commit || versionJson.commit === "unknown") {
  failures.push("version.json: لا يحمل commit حقيقي");
}

const swBuildIdMatch = swVersionJs.match(/SW_BUILD_ID\s*=\s*["']([a-f0-9]+)["']/i);
if (!swBuildIdMatch) {
  failures.push("sw-version.js: لا يحتوي SW_BUILD_ID بصيغة متوقَّعة");
} else if (!versionJson.commit.startsWith(swBuildIdMatch[1]) && swBuildIdMatch[1] !== versionJson.shortCommit) {
  failures.push(`sw-version.js (${swBuildIdMatch[1]}) لا يطابق version.json (${versionJson.shortCommit})`);
}

if (!/importScripts\(["']\/sw-version\.js["']\)/.test(swJs)) {
  failures.push("sw.js: لا يستورد sw-version.js — قد يعود للاعتماد على قيمة ثابتة");
}
if (/majalis-shell-v\d+["'`]/.test(swJs) || /majalis-data-v\d+["'`]/.test(swJs)) {
  failures.push("sw.js: عاد رقم كاش يدوي ثابت (مثل v18) بدل SW_BUILD_ID الديناميكي");
}
if (!/OFFLINE_CACHE\s*=\s*`majalis-offline-\$\{SW_BUILD_ID\}`/.test(swJs)) {
  failures.push("sw.js: OFFLINE_CACHE غير مبني فعليًا من SW_BUILD_ID");
}
if (!/DATA_CACHE\s*=\s*`majalis-data-\$\{SW_BUILD_ID\}`/.test(swJs)) {
  failures.push("sw.js: DATA_CACHE غير مبني فعليًا من SW_BUILD_ID");
}
if (/SHELL_ROUTES|cache\.addAll\(\[?["']\//.test(swJs)) {
  failures.push("sw.js: لا يجوز تخزين shell routes أو صفحات التنقل مسبقًا");
}
if (!/req\.mode === ["']navigate["'][\s\S]*networkFirstNavigation\(req\)/.test(swJs)) {
  failures.push("sw.js: صفحات التنقل لا تستخدم network-first الصريح");
}
const navigationHandler = swJs.match(/async function networkFirstNavigation\(req\) \{([\s\S]*?)\n\}/)?.[1] || "";
if (/cache\.put|caches\.match\(req\)/.test(navigationHandler)) {
  failures.push("sw.js: معالج التنقل ما زال يخزن HTML أو يرجع صفحة قديمة");
}

if (failures.length > 0) {
  console.error("❌ فشل التحقق من آلية إبطال الكاش المرتبطة بالبناء:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log(
  `✓ الكاش مربوط فعليًا بمعرّف البناء (${versionJson.shortCommit}) — لا رقم يدوي، لا اعتماد على تذكّر أحد.`,
);
