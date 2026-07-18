#!/usr/bin/env node
/**
 * إعادة توليد src/data/scholars-list.json من src/lib/scholars-data.ts.
 *
 * اكتُشف 2026-07-18: هذا الملف كان مجمَّداً عند 78 عالماً (منهم اثنان
 * بمعرِّفات قديمة غير مطابقة للحالي: "ibn-mufli"→"ibn-muflih"،
 * "amir-al-san'ani"→"al-amir-al-sanani") بينما scholars-data.ts الحي وصل
 * 96 — **20 عالماً غائبون عن هذا الملف**. الخطورة: هذا الملف يُستهلَك في
 * lib/cms/sitemap-builder.mjs الذي يُبني /api/sitemap و/api/feed **الحيّين
 * فعلياً في الإنتاج** (مسجَّلان في lib/api-dispatch.mjs، وvercel.json يُعيد
 * توجيه /sitemap.xml و/feed.xml إليهما مباشرة) — أي أن خريطة الموقع
 * (sitemap) الحقيقية المُرسَلة لمحركات البحث كانت تفتقد 20 صفحة عالم
 * لأشهر، على عكس public/sitemap.xml الثابت (المولَّد عبر generate-seo.mjs)
 * الذي قد لا يُخدَّم إطلاقاً بسبب rewrite صريح في vercel.json.
 *
 * نفس عائلة عطل src/data/library-catalog.json المُصلَح سابقاً في هذه
 * الجلسة — لا فحص دائم آلي مثل test:library-integrity محمي به هذا الملف
 * بعد؛ التوليد اليدوي هنا هو الإصلاح الفوري.
 *
 * التشغيل: npx tsx scripts/regen-scholars-list-json.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const SCHOLARS_TS_PATH = resolve(APP_ROOT, "src/lib/scholars-data.ts");
const SCHOLARS_JSON_PATH = resolve(APP_ROOT, "src/data/scholars-list.json");

const { SCHOLARS } = await import(SCHOLARS_TS_PATH);

const oldJson = JSON.parse(await readFile(SCHOLARS_JSON_PATH, "utf8"));

const newJson = SCHOLARS.map((s) => ({ id: s.id, name: s.name, died: s.died }));

await writeFile(SCHOLARS_JSON_PATH, JSON.stringify(newJson, null, 2) + "\n", "utf8");

console.log(`✓ أُعيد توليد scholars-list.json: ${newJson.length} عالماً (كان ${oldJson.length}).`);
