#!/usr/bin/env node
/**
 * توليد src/data/fiqh-sessions-list.json من src/lib/fiqh-sessions-seed.ts.
 *
 * اكتُشف 2026-07-18 (أثناء تدقيق fetchDynamicUrls في lib/cms/sitemap-builder.mjs):
 * جدول fiqh_council_sessions غير موجود أصلاً في القاعدة الحية (تحقَّق
 * مباشر عبر information_schema.tables + استعلام فاشل) — الصفحة الحية
 * `/fiqh-council/sessions/:slug` تعمل فعلياً لكن بالكامل عبر fallback
 * ثابت في fiqh-council-sessions-service.ts (isMissingTableError() يلتقط
 * الخطأ ويرجع FIQH_SESSIONS_PUBLISHED_SEED). أي أن هذا المحتوى حقيقي
 * ومرئي للزوار لكنه لم يكن مُدرَجاً في sitemap.xml إطلاقاً (لا استعلام
 * DB ممكن لجدول غير موجود، ولا مرآة JSON كانت موجودة أصلاً).
 *
 * نفس نمط src/data/scholars-list.json و src/data/library-catalog.json —
 * مرآة ثابتة بحقول دنيا (slug + updated_at) يقرأها sitemap-builder.mjs
 * وقت التشغيل عبر loadStaticCatalog() بلا حاجة لـtsx/بناء.
 *
 * التشغيل: npx tsx scripts/regen-fiqh-sessions-json.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const SEED_TS_PATH = resolve(APP_ROOT, "src/lib/fiqh-sessions-seed.ts");
const JSON_PATH = resolve(APP_ROOT, "src/data/fiqh-sessions-list.json");

const { FIQH_SESSIONS_PUBLISHED_SEED } = await import(SEED_TS_PATH);

let oldCount = 0;
try {
  oldCount = JSON.parse(await readFile(JSON_PATH, "utf8")).length;
} catch {
  oldCount = 0;
}

const published = FIQH_SESSIONS_PUBLISHED_SEED.filter(
  (s) => s.publish_status === "published" && s.verification_status === "verified",
);

const newJson = published.map((s) => ({ slug: s.slug, updated_at: s.updated_at }));

await writeFile(JSON_PATH, JSON.stringify(newJson, null, 2) + "\n", "utf8");

console.log(`✓ أُعيد توليد fiqh-sessions-list.json: ${newJson.length} جلسة (كان ${oldCount}).`);
