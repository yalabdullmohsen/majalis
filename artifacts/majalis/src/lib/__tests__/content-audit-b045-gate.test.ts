/**
 * بوابة b045: شبهات اكتشف الإسلام بلا حشو + مصطلح الحديث بأمثلة.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const faq = JSON.parse(read("public/data/knowledge/discover-islam/path-and-faq.json")) as {
  items: Array<{ id: string; body: string; evidences?: Array<{ ref?: string }> }>;
};

const doubts = (faq.items || []).filter((i) => String(i.id || "").startsWith("discover-doubt-"));
assert.ok(doubts.length >= 10, "شبهات اكتشف الإسلام ≥10");
for (const d of doubts) {
  assert.doesNotMatch(d.body, /للتوسع راجع التعريف/, `${d.id}: بلا حشو إحالة فارغ`);
  assert.match(d.body, /## ضابط الفهم/, `${d.id}: فيه ضابط فهم`);
  assert.ok((d.evidences || []).length >= 1, `${d.id}: دليل`);
}

const prayerByTitle = (faq.items || []).find((i) => (i as { title?: string }).title === "كم صلاة في اليوم؟");
assert.ok(prayerByTitle, "FAQ الصلوات");
assert.match(prayerByTitle!.body, /بيان أوضح|خمس/, "إجابة الصلوات موسّعة");

const hs = read("src/pages/hadith/ui/HadithScienceView.tsx");
const termBlocks = hs.split(/\n {2}\{\n {4}id:/).slice(1);
assert.ok(termBlocks.length >= 90, "مصطلحات الحديث ≥90");
for (const b of termBlocks) {
  const id = (b.match(/^\s*"([^"]+)"/) || [])[1];
  assert.match(b, /example:/, `مصطلح ${id} له مثال`);
}

console.log("content-audit-b045-gate: ok");
