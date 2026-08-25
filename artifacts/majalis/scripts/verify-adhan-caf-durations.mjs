#!/usr/bin/env node
/**
 * يرفض أي adhan-*.caf ≥ ٣٠ث — حد Apple لإشعار النظام.
 * الهدف التشغيلي ≤ ٢٩ث حتى لا يُستبدل الملف بالصوت الافتراضي.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sounds = join(root, "ios/App/App/Sounds");
/** أقل من ٣٠ث بهامش أمان؛ الملفات الحالية ≈١١–٢٨.٧ث */
const MAX_SEC = 29.05;
const failures = [];

for (const name of readdirSync(sounds)) {
  if (!name.startsWith("adhan-") || !name.endsWith(".caf")) continue;
  const p = join(sounds, name);
  const r = spawnSync("afinfo", [p], { encoding: "utf8" });
  const m = String(r.stdout).match(/estimated duration:\s*([\d.]+)\s*sec/);
  const dur = m ? Number(m[1]) : null;
  if (dur == null) {
    failures.push(`${name}: could not read duration`);
    continue;
  }
  console.log(`${name}: ${dur.toFixed(2)}s`);
  if (dur > MAX_SEC) {
    failures.push(
      `${name}: ${dur.toFixed(2)}s > ${MAX_SEC}s — صوت إشعار iOS يجب أن يكون أقل من 30 ثانية`,
    );
  }
}

if (failures.length) {
  console.error("\nverify-adhan-caf-durations FAILED:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("\nverify-adhan-caf-durations: ok (≤29.05s)");
