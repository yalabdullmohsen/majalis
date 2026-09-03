/**
 * بوابة b055: اكتشف الإسلام — بلا بيان/توجيه قالبي مكرر، ومحطات بـ«لماذا» فريدة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b055-discover-islam-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const fp = resolve(root, "public/data/knowledge/discover-islam/path-and-faq.json");
const data = JSON.parse(readFileSync(fp, "utf8")) as {
  items: { id: string; body: string }[];
};

const GENERIC_BAYAN = "اعمل بما علمت في حدود استطاعتك، واسأل أهل العلم عند الإشكال الخاص.";
const GENERIC_TAWJIH = "هذا للمتعلم وحديث العهد. النوازل الشخصية تُسأل فيها عالمًا موثوقًا.";
const GENERIC_WHY = "لأن فهم الإسلام يكون خطوة خطوة، بلا ضغط ولا جدال حاد.";

function section(body: string, title: string): string {
  return (body.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(?=\\n## |$)`)) || [])[1]?.trim() || "";
}

const faqs = data.items.filter((i) => i.id.startsWith("discover-faq-"));
const paths = data.items.filter((i) => /^discover-path-\d/.test(i.id));
assert.ok(faqs.length >= 100, "FAQ كافية");
assert.equal(paths.length, 20, "20 محطة مسار");

const bayans = new Set<string>();
const whys = new Set<string>();

for (const it of faqs) {
  const b = section(it.body, "بيان أوضح");
  const t = section(it.body, "توجيه");
  assert.notEqual(b, GENERIC_BAYAN, `${it.id}: بيان قالبي`);
  assert.notEqual(t, GENERIC_TAWJIH, `${it.id}: توجيه قالبي`);
  assert.ok(b.length > 40, `${it.id}: بيان قصير`);
  bayans.add(b);
}

for (const it of paths) {
  const why = section(it.body, "لماذا هذه المحطة؟");
  const now = section(it.body, "ماذا أفعل الآن؟");
  assert.notEqual(why, GENERIC_WHY, `${it.id}: لماذا قالبي`);
  assert.ok(why.length > 30, `${it.id}: لماذا قصيرة`);
  assert.ok(now.length > 30, `${it.id}: ماذا الآن قصيرة`);
  whys.add(why);
}

assert.equal(bayans.size, faqs.length, "بيان فريد لكل سؤال");
assert.equal(whys.size, 20, "لماذا فريدة لكل محطة");

console.log("content-audit-b055-discover-islam-gate: ok");
