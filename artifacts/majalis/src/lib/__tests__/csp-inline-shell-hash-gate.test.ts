/**
 * بوابة: سكربت الدخولية خارجي تحت 'self'، وكل inline في index.html مُجزّأ في CSP.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");

assert.match(
  indexHtml,
  /src="\/mj-launch-splash-boot\.js"/,
  "دخولية الإطلاق من ملف خارجي تحت 'self'",
);
assert.doesNotMatch(
  indexHtml,
  /var MAX_MS = 1400/,
  "سكربت الدخولية لم يعد inline (كان يُحظر بـ CSP)",
);
assert.ok(
  existsSync(resolve(root, "public/mj-launch-splash-boot.js")),
  "public/mj-launch-splash-boot.js موجود",
);

const bootJs = readFileSync(resolve(root, "public/mj-launch-splash-boot.js"), "utf8");
assert.match(bootJs, /mj-launch-splash/, "ملف الدخولية يستهدف العنصر");
assert.match(bootJs, /MAX_MS\s*=\s*1400/, "سقف إخفاء الدخولية");

const splashTs = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
assert.match(splashTs, /dismissHtmlLaunchSplash/, "React يزيل الدخولية HTML");
assert.match(
  splashTs,
  /export function armNativeSplashController\(\): void \{\n {2}armedAt/,
  "armNativeSplashController يعمل على الويب وليس الأصلي فقط",
);
assert.doesNotMatch(
  splashTs,
  /export function armNativeSplashController\(\): void \{\n {2}if \(!Capacitor\.isNativePlatform\(\)\) return;/,
  "ممنوع early-return يمنع إخفاء الدخولية على الويب",
);

const inline = [...indexHtml.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
const blocked: string[] = [];
for (const m of inline) {
  const attrs = m[1] || "";
  const body = m[2] || "";
  if (/type\s*=\s*["']application\/ld\+json["']/.test(attrs)) continue;
  if (!body.trim()) continue;
  const hash = createHash("sha256").update(body, "utf8").digest("base64");
  const token = `'sha256-${hash}'`;
  if (!vercel.includes(token)) {
    blocked.push(`${token} :: ${body.trim().slice(0, 48).replace(/\s+/g, " ")}`);
  }
}
assert.equal(
  blocked.length,
  0,
  `سكربتات inline بلا hash في CSP:\n${blocked.join("\n")}`,
);

console.log(`csp-inline-shell-hash-gate.test.ts: ok — inline_checked=${inline.length}`);
