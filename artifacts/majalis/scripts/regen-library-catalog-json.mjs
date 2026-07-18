#!/usr/bin/env node
/**
 * إعادة توليد src/data/library-catalog.json من src/lib/library-catalog.ts
 * (المصدر الحي الوحيد الذي يستهلكه التطبيق فعلياً — نفس الملاحظة الموثَّقة
 * في scripts/generate-seo.mjs).
 *
 * اكتُشف 2026-07-18: library-catalog.json كان قد جمد عند 102 كتاب بينما
 * library-catalog.ts وصل 127 (ثم 126 بعد حذف تكرار "منهاج الطالبين") —
 * 25+ كتاباً لم تُفحص إطلاقاً بواسطة test:library-integrity (الذي يقرأ
 * حصراً من هذا الملف الـJSON). هذا السكربت يُعيد المزامنة ويُبقي أي إثراء
 * سابق (authorId/editions/verificationStatus/sources) للكتب التي لها
 * سجل JSON مطابق مسبقاً، ويضع افتراضات محايدة (pending_review، sources
 * فارغة) للكتب الجديدة كلياً.
 *
 * التشغيل: npx tsx scripts/regen-library-catalog-json.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { normalizeTitle, normalizeAuthor } from "./test-library-integrity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, "..");
const CATALOG_TS_PATH = resolve(APP_ROOT, "src/lib/library-catalog.ts");
const CATALOG_JSON_PATH = resolve(APP_ROOT, "src/data/library-catalog.json");
const AUTHORS_JSON_PATH = resolve(APP_ROOT, "src/data/library-authors.json");

// تعيين يدوي لاستمرارية authorId عند حذف تكرار (id قديم → id جديد ناجٍ)
// اكتُشف 2026-07-18: "book-minhaj-talibin" (منهاج الطالبين، النووي) كان
// تكراراً حقيقياً لـ"book-al-minhaj-nawawi" (منهاج الطالبين وعمدة
// المفتين، نفس المؤلف نفس الكتاب) — أُزيل الأول من library-catalog.ts،
// وهذا التعيين ينقل إثراءه (authorId) للثاني بدل فقدانه.
const MERGED_ID_ALIASES = {
  "book-al-minhaj-nawawi": "book-minhaj-talibin",
};

const { LIBRARY_CATALOG } = await import(CATALOG_TS_PATH);

const oldJson = JSON.parse(await readFile(CATALOG_JSON_PATH, "utf8"));
const oldById = new Map(oldJson.map((b) => [b.id, b]));

const authors = JSON.parse(await readFile(AUTHORS_JSON_PATH, "utf8"));
const authorIdByNormalizedName = new Map(authors.map((a) => [normalizeAuthor(a.name), a.id]));

const liveIds = new Set(LIBRARY_CATALOG.map((b) => b.id));
const newJson = [];
let carriedOver = 0;
let brandNew = 0;

for (const book of LIBRARY_CATALOG) {
  const legacyId = MERGED_ID_ALIASES[book.id];
  const old = oldById.get(book.id) ?? (legacyId ? oldById.get(legacyId) : undefined);

  const normalizedTitle = normalizeTitle(book.title);
  const authorIdGuess = authorIdByNormalizedName.get(normalizeAuthor(book.author)) ?? null;

  if (old) {
    carriedOver++;
    newJson.push({
      id: book.id,
      slug: book.id,
      title: book.title,
      canonicalTitle: book.title,
      normalizedTitle,
      author: book.author,
      authorId: old.authorId ?? authorIdGuess,
      category: book.category,
      description: book.description,
      editions: old.editions ?? [],
      verificationStatus: old.verificationStatus ?? "pending_review",
      sources: old.sources ?? [],
      reviewedBy: old.reviewedBy ?? null,
      reviewedAt: old.reviewedAt ?? null,
    });
  } else {
    brandNew++;
    newJson.push({
      id: book.id,
      slug: book.id,
      title: book.title,
      canonicalTitle: book.title,
      normalizedTitle,
      author: book.author,
      authorId: authorIdGuess,
      category: book.category,
      description: book.description,
      editions: [],
      verificationStatus: "pending_review",
      sources: [],
      reviewedBy: null,
      reviewedAt: null,
    });
  }
}

const orphaned = oldJson.filter((b) => !liveIds.has(b.id) && b.id !== "book-minhaj-talibin");
if (orphaned.length) {
  console.log(`تحذير: ${orphaned.length} سجل JSON قديم لا يطابق أي كتاب حي (غير المدمج يدوياً):`);
  for (const o of orphaned) console.log(`  - ${o.id} (${o.title})`);
}

await writeFile(CATALOG_JSON_PATH, JSON.stringify(newJson, null, 2) + "\n", "utf8");

console.log(`✓ أُعيد توليد library-catalog.json: ${newJson.length} كتاباً (كان ${oldJson.length}).`);
console.log(`  ${carriedOver} احتفظ بإثرائه السابق، ${brandNew} كتاب جديد بقيم افتراضية.`);
