/**
 * بوابة b056: intro-islam موسَّع + عبرة تاريخ فريدة لكل عصر (بلا القالب المشترك).
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b056-intro-history-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const GENERIC_IBRA =
  "يُقرأ التاريخ للعبرة وحفظ الدين ونصرته، لا للطعن في الصحابة ولا لتقديس الملوك بلا دليل. والعمدة ما صحّ من النقل مع الإنصاف.";

function section(body: string, title: string): string {
  return (body.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(?=\\n## |$)`)) || [])[1]?.trim() || "";
}

function wc(s: string): number {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const intro = JSON.parse(
  readFileSync(resolve(root, "public/data/knowledge/intro-islam/topics.json"), "utf8"),
) as { items: { id: string; body: string; review_status?: string }[] };

assert.equal(intro.items.length, 14, "14 موضوع تعريف");
for (const it of intro.items) {
  assert.equal(it.review_status, "verified", `${it.id}: verified`);
  assert.ok(wc(it.body) >= 40, `${it.id}: أقصر من حد intro-islam`);
  assert.match(it.body, /## تنبيه\n/, `${it.id}: تنبيه`);
}

const hist = JSON.parse(
  readFileSync(resolve(root, "public/data/knowledge/history/timeline.json"), "utf8"),
) as { items: { id: string; body: string; review_status?: string }[] };

assert.equal(hist.items.length, 17, "17 بطاقة تاريخ");
const ibras = new Set<string>();
for (const it of hist.items) {
  assert.equal(it.review_status, "verified", `${it.id}: verified`);
  const ibra = section(it.body, "عبرة");
  assert.ok(ibra.length > 40, `${it.id}: عبرة قصيرة`);
  assert.notEqual(ibra, GENERIC_IBRA, `${it.id}: عبرة قالب`);
  ibras.add(ibra);
}
assert.equal(ibras.size, 17, "عبرة فريدة لكل عصر");

console.log("content-audit-b056-intro-history-gate: ok");
