/**
 * بوابة موجة تدقيق المحتوى ١: ملاءمة عناوين/آيات + مصادر الحديث الضعيف + فرادة الفوائد.
 * node --import tsx src/lib/__tests__/content-audit-wave1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getSectionById } from "@/config/sections.registry";
import { FAWAID_CURATED_SEED } from "@/lib/fawaid-curated-seed";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const asbab = getSectionById("quran-asbab");
assert.ok(asbab);
assert.equal(asbab.label, "قصص السور");
assert.equal(asbab.route, "/quran/surah-stories");
assert.match(asbab.subtitle, /محاور|قصص/);

const page = read("src/pages/quran/ui/SurahStoriesView.tsx");
assert.match(page, /title="قصص القرآن"|قصص سور القرآن/);

const texts = FAWAID_CURATED_SEED.map((f) => f.text);
assert.equal(new Set(texts).size, texts.length, "لا تكرار حرفي لنص الفائدة");
assert.ok(texts.length >= 1500, `حجم معقول بعد إزالة التكرار (${texts.length})`);

const daif = JSON.parse(read("public/data/hadith-verified/daif-000.json")) as Array<{
  source_name?: string;
}>;
for (const h of daif) {
  const sn = (h.source_name || "").trim();
  assert.notEqual(sn, "ضعيف", "source_name ليس الدرجة وحدها");
  assert.notEqual(sn, "ضعيف جداً");
  assert.notEqual(sn, "موضوع");
}

console.log("content-audit-wave1-gate.test.ts: ok");
