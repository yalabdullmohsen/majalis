#!/usr/bin/env node
/**
 * بوابة انحدار أداء: تقارن وسيط قياس جديد بآخر أساس مسجَّل.
 * الاستخدام:
 *   PERF_NEW='{"lcpMs":5000,"tbtMs":400}' node scripts/perf-regression-gate.mjs
 * أو ملف: node scripts/perf-regression-gate.mjs /tmp/new-median.json
 *
 * تفشل إن ارتفع TBT أو LCP عن الأساس (انحدار). لا تستخدم عتبة مطلقة فقط.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const baselinePath = resolve(root, "perf-baseline.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

let next;
if (process.env.PERF_NEW) {
  next = JSON.parse(process.env.PERF_NEW);
} else if (process.argv[2]) {
  next = JSON.parse(readFileSync(process.argv[2], "utf8"));
} else {
  console.log("perf-regression-gate: لا قياس جديد — طباعة الأساس فقط");
  console.log(JSON.stringify(baseline.median, null, 2));
  process.exit(0);
}

const med = next.median || next;
const b = baseline.median;
const fails = [];
if (typeof med.tbtMs === "number" && med.tbtMs > b.tbtMs) {
  fails.push(`TBT انحدار: ${med.tbtMs} > أساس ${b.tbtMs}`);
}
if (typeof med.lcpMs === "number" && med.lcpMs > b.lcpMs) {
  fails.push(`LCP انحدار: ${med.lcpMs} > أساس ${b.lcpMs}`);
}

if (fails.length) {
  console.error("perf-regression-gate FAILED:");
  for (const f of fails) console.error(" -", f);
  process.exit(1);
}

console.log("perf-regression-gate: ok (لا انحدار TBT/LCP)");
if (process.env.PERF_SAVE === "1") {
  const out = {
    updatedAt: new Date().toISOString(),
    source: next.source || "manual",
    commit: next.commit || baseline.commit,
    median: { ...b, ...med },
  };
  writeFileSync(baselinePath, JSON.stringify(out, null, 2) + "\n");
  console.log("updated", baselinePath);
}
