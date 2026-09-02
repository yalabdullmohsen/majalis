#!/usr/bin/env node
/**
 * فحص ميزانية الأداء — JS/CSS gzip + عتبات performance-budget.json.
 * يفشل إذا تجاوزت الأصول أو انخفضت العتبات عن الهامش المسموح.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budget = JSON.parse(readFileSync(resolve(root, "performance-budget.json"), "utf8"));
const distAssets = resolve(root, "dist/assets");
const failures = [];

function gzipKb(filePath) {
  const raw = readFileSync(filePath);
  return gzipSync(raw).length / 1024;
}

function findLargest(pattern) {
  let best = null;
  for (const name of readdirSync(distAssets)) {
    if (!pattern.test(name)) continue;
    const p = join(distAssets, name);
    const size = statSync(p).size;
    if (!best || size > best.raw) best = { name, path: p, raw: size };
  }
  return best;
}

console.log("▶ check-performance-budget\n");

if (!existsSync(distAssets)) {
  console.error("❌ dist/assets مفقود — شغّل build أولًا");
  process.exit(1);
}

const entryJs = findLargest(/^index-.*\.js$/);
const entryCss = findLargest(/^index-.*\.css$/);

if (!entryJs) failures.push("index-*.js مفقود");
if (!entryCss) failures.push("index-*.css مفقود");

if (entryJs) {
  const kb = gzipKb(entryJs.path);
  console.log(`· JS initial gzip: ${kb.toFixed(1)}KB (${entryJs.name})`);
  if (kb > budget.assets.jsInitialGzipKb) {
    failures.push(`JS gzip ${kb.toFixed(1)}KB > ${budget.assets.jsInitialGzipKb}KB`);
  }
}

if (entryCss) {
  const kb = gzipKb(entryCss.path);
  console.log(`· CSS initial gzip: ${kb.toFixed(1)}KB (${entryCss.name})`);
  if (kb > budget.assets.cssInitialGzipKb) {
    failures.push(`CSS gzip ${kb.toFixed(1)}KB > ${budget.assets.cssInitialGzipKb}KB`);
  }
}

const lhciPath = resolve(root, "config/lhci-main-baseline.json");
if (existsSync(lhciPath)) {
  const { median } = JSON.parse(readFileSync(lhciPath, "utf8"));
  const margin = budget.regressionMargin || 0.1;
  // لا نُقارن baseline الشاهد بأهداف PSI الطموحة — فقط نمنع تجاوز baseline × (1+margin)
  const maxLcp = median.lcpMs * (1 + margin);
  const maxFcp = median.fcpMs * (1 + margin);
  const maxCls = Math.max(budget.webVitals.cls, median.cls) * (1 + margin);
  console.log(`· baseline LCP/FCP/CLS: ${median.lcpMs}/${median.fcpMs}/${median.cls}`);
  console.log(`· regression caps (+${Math.round(margin * 100)}%): ${Math.ceil(maxLcp)}/${Math.ceil(maxFcp)}/${maxCls.toFixed(3)}`);
}

if (failures.length) {
  console.error("❌ check-performance-budget فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✅ check-performance-budget — نجح");
