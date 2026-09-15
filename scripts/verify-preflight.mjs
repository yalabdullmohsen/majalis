#!/usr/bin/env node
/**
 * verify:preflight — فحوص سريعة إلزامية قبل `verify:ci`.
 *
 * يوحّد المسار الموجود (`verify:changed` + حوكمة الوكيل) ولا يُضعف البوابات.
 * الاستخدام (من جذر git):
 *   pnpm run verify:preflight
 *
 * بعد النجاح فقط: pnpm run verify:ci
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, cmd, args) {
  console.log(`\n── preflight: ${label} ──`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`\nverify:preflight فشل عند: ${label}`);
    process.exit(r.status ?? 1);
  }
}

if (!existsSync(resolve(ROOT, "package.json")) || !existsSync(resolve(ROOT, "pnpm-workspace.yaml"))) {
  console.error("verify:preflight: شغّل من جذر monorepo فقط.");
  process.exit(2);
}

run("changed-scope policy", process.execPath, ["scripts/verify-changed-scope.mjs"]);
run(
  "agent-throughput governance",
  process.execPath,
  ["--test", "scripts/__tests__/agent-throughput-policy.test.mjs"],
);

console.log("\n✓ verify:preflight نجحت — مسموح الآن بـ pnpm run verify:ci مرة واحدة بعد IMPLEMENTATION_FROZEN.\n");
