#!/usr/bin/env node
/**
 * يستبعد خطوط QPC V2 (~٩٤MB) من حزم Capacitor الأصلية بعد sync.
 * الخطوط تُنزَّل عند أول تشغيل إلى Cache API (انظر qpc-font-pack.ts).
 *
 *   node scripts/native-strip-qpc-fonts.mjs
 */
import { existsSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  join(root, "ios/App/App/public/fonts/qpc-v2"),
  join(root, "android/app/src/main/assets/public/fonts/qpc-v2"),
];

function dirSize(path) {
  try {
    return statSync(path).isDirectory() ? "present" : "missing";
  } catch {
    return "missing";
  }
}

let stripped = 0;
for (const dir of targets) {
  if (!existsSync(dir)) {
    console.log(`skip (absent): ${dir}`);
    continue;
  }
  console.log(`strip: ${dir} (${dirSize(dir)})`);
  rmSync(dir, { recursive: true, force: true });
  stripped += 1;
}

console.log(
  stripped > 0
    ? `✓ أُزيلت خطوط QPC من ${stripped} مسار أصلي — التنزيل عند التشغيل`
    : "لا مسارات أصلية لإزالة الخطوط منها",
);
