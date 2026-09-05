#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

/** أسرار حقيقية فقط — لا مجرّد ذكر اسم المتغيّر في رسائل الحماية */
const BAD = [
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]{20,}/,
  /service_role['"]\s*:\s*['"]eyJ[A-Za-z0-9_-]{20,}/,
  /BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/,
  /sk_live_[0-9a-zA-Z]{20,}/,
  /sk_test_[0-9a-zA-Z]{20,}/,
  /eyJhbGciOiJ(?:a|A)[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".map")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|html|json|txt|xml|webmanifest|css)$/.test(name)) out.push(p);
  }
  return out;
}

if (!existsSync(dist)) {
  console.error("verify-no-secret-leak: dist missing");
  process.exit(1);
}
const hits = [];
for (const f of walk(dist)) {
  const t = readFileSync(f, "utf8");
  for (const re of BAD) {
    if (re.test(t)) hits.push(`${f}: ${re}`);
  }
}
if (hits.length) {
  console.error("verify-no-secret-leak: FAIL");
  console.error(hits.slice(0, 20).join("\n"));
  process.exit(1);
}
console.log("verify-no-secret-leak: ok");
