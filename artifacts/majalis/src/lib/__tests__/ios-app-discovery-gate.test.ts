/**
 * بوابة اكتشاف تطبيق الآيفون — بلا روابط مضلّلة قبل نشر App Store.
 * node --import tsx src/lib/__tests__/ios-app-discovery-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const footer = read("src/components/SiteFooter.tsx");
const about = read("src/views/AboutPage.tsx");
const hero = read("src/components/home/HomeHeroLcp.tsx");
const structured = read("src/lib/seo-structured-data.ts");
const footerNav = read("src/lib/site-footer-nav.ts");
const seoRoutes = read("src/lib/seo-routes.json");
const iosHelper = read("src/lib/ios-app-store.ts");

function iosAppStoreUrlFromSrc() {
  const m = iosHelper.match(/export const IOS_APP_STORE_URL\s*=\s*"([^"]*)"/);
  return m?.[1] || "";
}

assert.ok(existsSync(resolve(root, "src/components/IosAppCta.tsx")), "مكوّن CTA جاهز");
assert.ok(existsSync(resolve(root, "src/components/IosAppCtaSlot.tsx")), "Slot جاهز للربط بعد الرابط");
assert.ok(existsSync(resolve(root, "src/styles/components/ios-app-cta.css")), "أنماط CTA جاهزة");
assert.match(iosHelper, /export const IOS_APP_STORE_URL\s*=\s*""/, "الرابط فارغ حتى النشر الرسمي");
assert.match(iosHelper, /isProductionAppStoreUrl/, "تحقق من رابط App Store الإنتاجي");
assert.match(iosHelper, /apps\.apple\.com/, "المضيف المسموح App Store فقط");
assert.match(iosHelper, /testflight/i, "رفض TestFlight");
assert.doesNotMatch(footer, /IosAppCta/, "التذييل لا يستورد CTA قبل الرابط (حماية الميزانية)");
assert.match(about, /تجربة الآيفون/, "About يوضح تجربة الآيفون");
assert.match(about, /SoftwareApplication/, "About يحمل SoftwareApplication");
assert.ok(existsSync(resolve(root, "src/lib/seo-app-jsonld.ts")), "مساعد JSON-LD جاهز للربط عند الرابط");
assert.match(read("src/lib/seo-app-jsonld.ts"), /SoftwareApplication/, "Structured Data للتطبيق");
assert.doesNotMatch(structured, /ios-app-store/, "لا ios-app-store في مسار entry");
assert.doesNotMatch(structured, /softwareApplicationJsonLd/, "SoftwareApplication خارج defaultSiteJsonLd");
assert.doesNotMatch(about, /seo-app-jsonld/, "About بلا استيراد ثقيل يضغط الميزانية");
assert.match(hero, /رفيقك اليومي/, "هيرو يحمل جملة قيمة");
assert.match(footerNav, /رفيقك اليومي لطلب العلم/, "تذييل بلا شعار ضعيف");
assert.doesNotMatch(footerNav, /الريادة الإسلامية الرقمية/, "لا شعار الريادة الضعيف");
assert.doesNotMatch(seoRoutes, /منصة علمية شرعية كويتية/, "About SEO بلا صياغة ضعيفة");
assert.match(seoRoutes, /تطبيق سُنّة رفيقك اليومي/, "وصف الرئيسية يذكر تطبيق سُنّة");
assert.match(read("index.html"), /SoftwareApplication/, "index.html يحمل SoftwareApplication");
assert.match(read("index.html"), /تطبيق سُنّة رفيقك اليومي/, "OG الرئيسية يذكر تطبيق سُنّة");
assert.equal(iosAppStoreUrlFromSrc(), "", "لا رابط App Store قبل النشر");

console.log("ios-app-discovery-gate.test.ts: ok");
