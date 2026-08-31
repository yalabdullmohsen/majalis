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
assert.match(post, /setTimeout\(a,\s*3200\)/, "نافذة LCP قبل إخفاء الصدفة");
assert.match(post, /#seo-shell\{[^}]*z-index:\s*2/, "الصدفة فوق #root حتى الإزالة");

/** النص الحرفي كما يُحقن في HTML (داخل <script>…</script>) */
const SCRIPT =
  "(function(){function a(){document.documentElement.classList.add('js-ready');var s=document.getElementById('seo-shell');if(s)s.remove()}function arm(){setTimeout(a,3200)}var r=document.getElementById('root');if(r&&r.hasChildNodes())arm();else{var o=new MutationObserver(function(){if(r&&r.hasChildNodes()){o.disconnect();arm()}});o.observe(r||document.documentElement,{childList:true,subtree:true});setTimeout(a,9000)}})()";
assert.ok(post.includes(`<script>${SCRIPT}</script>`), "نص السكربت ثابت بلا مسافات زائدة");
assert.ok(SCRIPT.startsWith("(function"), "IIFE كامل بين وسمَي script");

const hash = createHash("sha256").update(SCRIPT, "utf8").digest("base64");
const token = `'sha256-${hash}'`;
assert.ok(vercel.includes(token), `CSP يجب أن يحتوي ${token}`);

assert.ok(!vercel.includes("''sha256"), "لا اقتباس مزدوج قبل sha256 في CSP");
assert.ok(!/'sha256-[^']+=''/.test(vercel), "لا اقتباس زائد بعد hash في CSP");

console.log(`csp-seo-shell-hash-gate.test.ts: ok — ${token}`);
