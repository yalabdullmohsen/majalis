/**
 * بوابة صفحة الدعم الفني — مسار App Store Support URL.
 * Run: node --import tsx src/lib/__tests__/support-page-gate.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const page = readFileSync(resolve(root, "src/views/SupportPage.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/support.css"), "utf8");
const routes = readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
const ia = readFileSync(resolve(root, "src/lib/ia-final-structure.ts"), "utf8");
const registry = readFileSync(resolve(root, "src/config/sections.registry.ts"), "utf8");
const seoRoutes = readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8");

assert.ok(
  existsSync(resolve(root, "src/views/SupportPage.tsx")),
  "SupportPage.tsx موجود",
);
assert.match(routes, /path="\/support"><SafeLazyRoute component=\{ContactPage\}/, "route /support عبر ContactPage (حزمة واحدة)");
assert.doesNotMatch(routes, /path="\/support"><Redirect/, "لا تحويل /support");
assert.doesNotMatch(routes, /lazy\(\(\) => import\("@\/views\/SupportPage"\)\)/, "لا lazy منفصل لـ SupportPage (ميزانية الإقلاع)");

assert.doesNotMatch(vercel, /"source":\s*"\/support"/, "لا redirect دائم في vercel لـ /support");
assert.doesNotMatch(ia, /"\/support":\s*"\/contact"/, "لا IA_REDIRECTS لـ /support");
assert.doesNotMatch(registry, /from:\s*"\/support"/, "لا SECTION_MERGE لـ /support");
assert.match(seoRoutes, /"path":\s*"\/support"/, "seo-routes يتضمن /support");
assert.match(seoRoutes, /الدعم الفني/);

const contact = readFileSync(resolve(root, "src/views/ContactPage.tsx"), "utf8");
assert.match(contact, /location === "\/support"/, "ContactPage يوجّه /support إلى SupportPage");
assert.match(contact, /import SupportPage from "@\/views\/SupportPage"/);

assert.match(page, /الدعم الفني \| سُنّة/);
assert.match(page, /نساعدك في حل المشكلات والإجابة عن الاستفسارات المتعلقة بتطبيق سُنّة/);
assert.match(page, /CONTACT_EMAIL/);
assert.match(page, /mailtoWithSubject/);
assert.match(page, /الإبلاغ عن مشكلة/);
assert.match(page, /الاقتراحات/);
assert.match(page, /الرد على الاستفسارات/);
assert.match(page, /أسئلة شائعة/);
assert.match(page, /Accordion/);
assert.match(page, /path:\s*"\/support"/);
assert.match(page, /styles\/pages\/support\.css/);

assert.match(css, /\.support-page__card/);
assert.match(css, /grid-template-columns:\s*repeat\(2/);
assert.match(css, /\.support-page__faq/);

console.log("support-page-gate.test.ts: ok");
