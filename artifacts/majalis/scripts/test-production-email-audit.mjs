#!/usr/bin/env node
/**
 * يدقق مخرجات الإنتاج (dist + seo-prerender) بحثًا عن بريد غير الرسمي.
 * البريد الوحيد المسموح ظهوره: Majlisilm.app@gmail.com
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(appRoot, "site.config.json"), "utf8"));
const official = String(config.contactEmail).toLowerCase();
const forbidden = (config.forbiddenEmails || []).map((e) => String(e).toLowerCase());

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const failures = [];

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["assets", "data", "fonts", "images", "node_modules"].includes(entry.name)) continue;
      walkHtml(full, out);
    } else if (entry.name.endsWith(".html") || entry.name.endsWith(".json") || entry.name.endsWith(".webmanifest")) {
      out.push(full);
    }
  }
  return out;
}

const roots = [resolve(appRoot, "dist"), resolve(appRoot, "seo-prerender")].filter(existsSync);
if (!roots.length) {
  console.error("❌ لا يوجد dist/ ولا seo-prerender/ — شغّل البناء أولًا");
  process.exit(1);
}

let scanned = 0;
for (const root of roots) {
  for (const file of walkHtml(root)) {
    scanned++;
    const text = readFileSync(file, "utf8");
    const rel = file.slice(appRoot.length + 1);
    const lower = text.toLowerCase();
    for (const bad of forbidden) {
      if (lower.includes(bad)) failures.push(`${rel}: بريد ممنوع ${bad}`);
    }
    const emails = text.match(EMAIL_RE) || [];
    for (const raw of emails) {
      const e = raw.toLowerCase();
      if (e === official) continue;
      // تجاهل أمثلة schema/placeholder غير حقيقية
      if (e.endsWith(".example") || e.includes("example.com")) continue;
      failures.push(`${rel}: بريد غير رسمي ${raw}`);
    }
  }
}

if (failures.length) {
  console.error(`❌ فشل تدقيق البريد (${failures.length}) بعد فحص ${scanned} ملفًا:`);
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  if (failures.length > 40) console.error(`  … و${failures.length - 40} أخرى`);
  process.exit(1);
}

console.log(`✓ تدقيق البريد: ${scanned} ملفًا — لا بريد غير ${config.contactEmail}`);
