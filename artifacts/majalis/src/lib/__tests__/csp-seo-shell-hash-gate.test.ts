/**
 * بوابة: سكربت إزالة #seo-shell في prerender مُجزّأ في CSP.
 * تشغيل: node --import tsx src/lib/__tests__/csp-seo-shell-hash-gate.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const post = readFileSync(resolve(root, "scripts/post-build-seo.mjs"), "utf8");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");

assert.match(post, /classList\.add\('js-ready'\)/, "سكربت js-ready في post-build-seo");
assert.match(post, /getElementById\('seo-shell'\)/, "إزالة seo-shell");
assert.match(post, /MutationObserver/, "تأجيل إزالة seo-shell حتى يركّب React");

/** النص الحرفي كما يُحقن في HTML (داخل <script>…</script>) */
const SCRIPT =
  "(function(){function a(){document.documentElement.classList.add('js-ready');var s=document.getElementById('seo-shell');if(s)s.remove()}var r=document.getElementById('root');if(r&&r.hasChildNodes())a();else{var o=new MutationObserver(function(){if(r&&r.hasChildNodes()){o.disconnect();a()}});o.observe(r||document.documentElement,{childList:true,subtree:true});setTimeout(a,8000)}})()";
assert.ok(post.includes(`<script>${SCRIPT}</script>`), "نص السكربت ثابت بلا مسافات زائدة");
assert.ok(SCRIPT.startsWith("(function"), "IIFE كامل بين وسمَي script");

const hash = createHash("sha256").update(SCRIPT, "utf8").digest("base64");
const token = `'sha256-${hash}'`;
assert.ok(vercel.includes(token), `CSP يجب أن يحتوي ${token}`);

assert.ok(!vercel.includes("''sha256"), "لا اقتباس مزدوج قبل sha256 في CSP");
assert.ok(!/'sha256-[^']+=''/.test(vercel), "لا اقتباس زائد بعد hash في CSP");

console.log(`csp-seo-shell-hash-gate.test.ts: ok — ${token}`);
