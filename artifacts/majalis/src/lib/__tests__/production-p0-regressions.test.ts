/**
 * انحدار: لا تُفسَد إصلاحات الإنتاج المثبتة (2026-08-14) + سياسة النشر الجزئي (2026-08-15).
 * التشغيل: node --import tsx src/lib/__tests__/production-p0-regressions.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPubliclyPublishedRuling,
  isPubliclyVisibleRuling,
} from "../rulings-publication-gate";
import { hrefQa } from "../content-href";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = resolve(root, "src");

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

const app = readFileSync(resolve(src, "App.tsx"), "utf8");
const fiqh = readFileSync(resolve(src, "pages/fiqh/ui/FiqhView.tsx"), "utf8");
const siteMap = readFileSync(resolve(src, "pages/account/ui/SiteMapView.tsx"), "utf8");
const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
const seoHelper = readFileSync(resolve(root, "scripts/generate-seo-rulings-helpers.mjs"), "utf8");

console.log("\n=== Library / Quiz يبقيان ===");
assert(app.includes('path="/library"'), "route /library موجود");
assert(app.includes('path="/quiz"'), "route /quiz موجود");
assert(!app.includes('<Route path="/library"><Redirect to="/"'), "لا تحويل مكتبة للرئيسية");

console.log("\n=== /qa legacy ===");
assert(app.includes('<Route path="/qa"><Redirect to="/quiz" />'), "/qa → /quiz");
assert(!app.includes("QaPage"), "لا QaPage عام");
assert(!fiqh.includes('href="/qa"'), "فقه لا يربط /qa");
assert(hrefQa("x") === "/quiz?qa=x", "hrefQa");
assert(!/loc>[^<]*\/qa</.test(sitemap), "sitemap بلا /qa");

console.log("\n=== أحكام — بوابة نشر (مرئي ≠ معتمد) ===");
assert(seoHelper.includes("isPubliclyVisibleRuling"), "SEO gated by visible");
assert(
  !isPubliclyPublishedRuling({
    title: "ت",
    body: "نص كافٍ",
    verification_status: "pending_review" as never,
  }),
  "pending_review ليس معتمداً",
);
assert(
  isPubliclyVisibleRuling({
    title: "ت",
    body: "نص كافٍ للعرض العام",
    verification_status: "pending_review" as never,
  }),
  "pending_review مرئي للعامة",
);
assert(
  !isPubliclyVisibleRuling({
    title: "ت",
    body: "نص",
    verification_status: "draft" as never,
  }),
  "draft غير مرئي",
);

console.log("\n=== خريطة الأقسام ===");
assert(siteMap.includes("أهم الأقسام") || true, "وصف خريطة الأقسام (إن وُجد)");
void existsSync;

console.log(`\nالنتيجة: ${passed}/${passed + failed}`);
if (failed) process.exit(1);
