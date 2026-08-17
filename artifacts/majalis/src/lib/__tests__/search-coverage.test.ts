/**
 * بوابة تغطية البحث: كل مسار في السجل والتنقّل له وثيقة في الفهرس.
 * تشغيل: node --import tsx src/lib/__tests__/search-coverage.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requiredSearchRoutes, cleanSearchRoute } from "@/search/build-index";
import { SYNONYM_GROUP_COUNT } from "@/lib/search-synonyms";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const indexPath = resolve(root, "public/data/search/index.json");

assert.ok(existsSync(indexPath), "فهرس البحث مفقود");
const payload = JSON.parse(readFileSync(indexPath, "utf8")) as {
  count?: number;
  docs: { href: string; titleAr: string }[];
};

const indexed = new Set(payload.docs.map((d) => cleanSearchRoute(d.href)));
const required = requiredSearchRoutes();
const missing = required.filter((r) => !indexed.has(r) && ![...indexed].some((h) => h === r || h.startsWith(`${r}/`)));

assert.equal(
  missing.length,
  0,
  `مسارات بلا وثيقة في الفهرس (${missing.length}/${required.length}): ${missing.slice(0, 20).join(" · ")}`,
);
assert.ok(payload.docs.length >= required.length, `الوثائق ${payload.docs.length} < المسارات ${required.length}`);
assert.ok(SYNONYM_GROUP_COUNT >= 60, `مرادفات ${SYNONYM_GROUP_COUNT} < 60`);

console.log(
  `search-coverage.test.ts: ok — docs=${payload.docs.length} routes=${required.length} coverage=100% synonyms=${SYNONYM_GROUP_COUNT}`,
);
