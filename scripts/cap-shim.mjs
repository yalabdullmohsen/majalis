#!/usr/bin/env node
/**
 * جذر المستودع لا يملك إعداد Capacitor — الثنائي الحقيقي في artifacts/majalis.
 * تشغيل `npx cap …` من الجذر كان يحلّ حزمة npm الخاطئة cap@0.2.1 (بلا bin)
 * → "npm error could not determine executable to run".
 *
 * هذا الـshim يُعرَّف كـ bin باسم `cap` في package.json الجذري فيوجَّه
 * npx/pnpm exec إلى @capacitor/cli داخل حزمة majalis مع cwd الصحيح.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = resolve(repoRoot, "artifacts/majalis");
const capBin = resolve(appRoot, "node_modules/.bin/cap");

if (!existsSync(capBin)) {
  console.error(
    `cap-shim: لم يوجد ${capBin}\nشغّل من جذر المستودع: pnpm install\nثم أعد: npx cap sync ios`,
  );
  process.exit(1);
}

if (!existsSync(resolve(appRoot, "capacitor.config.ts")) && !existsSync(resolve(appRoot, "capacitor.config.json"))) {
  console.error(`cap-shim: لا يوجد capacitor.config في ${appRoot}`);
  process.exit(1);
}

const result = spawnSync(capBin, process.argv.slice(2), {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
  shell: false,
});

if (result.error) {
  console.error(`cap-shim: فشل تشغيل ${capBin}:`, result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
