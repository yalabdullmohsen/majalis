/**
 * مطابقة حقول مواد المجمع المنشورة مع صفحات المصدر الرسمي (IIFA).
 * لا يختلق محتوى؛ يفشل إن غاب رقم القرار أو الرابط أو نصّ أساسي عن الصفحة الرسمية.
 * node --import tsx src/lib/__tests__/fiqh-council-source-validation.test.ts
 */
import assert from "node:assert/strict";
import { FIQH_COUNCIL_PUBLISHED_SEED } from "../fiqh-council-seed.ts";
import { isVerifiedPublicItem } from "../fiqh-council-trust.ts";

const items = FIQH_COUNCIL_PUBLISHED_SEED.filter(isVerifiedPublicItem);
assert.equal(items.length, 4, "أربع مواد منشورة موثّقة");

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // IIFA يحقن علامات اتجاه Unicode بين الكلمات في النص الظاهر
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchOfficial(url: string): Promise<{ status: number; text: string }> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "MajlisilmSourceValidation/1.0 (+https://majlisilm.com)" },
  });
  const html = await res.text();
  return { status: res.status, text: stripHtml(html) };
}

const results: Array<{ slug: string; ok: boolean; notes: string[] }> = [];

for (const item of items) {
  const notes: string[] = [];
  assert.ok(item.source_url?.startsWith("https://www.iifa-aifi.org/"), `${item.slug}: رابط IIFA`);
  assert.ok(item.decision_number, `${item.slug}: رقم قرار`);
  assert.ok(item.session_number, `${item.slug}: رقم دورة`);
  assert.ok(item.session_date, `${item.slug}: تاريخ`);
  assert.ok((item.summary || "").length > 40, `${item.slug}: ملخص`);
  assert.ok((item.ruling_text || item.content || "").length > 40, `${item.slug}: نص حكم/محتوى`);

  const { status, text } = await fetchOfficial(item.source_url!);
  assert.equal(status, 200, `${item.slug}: HTTP المصدر ${status}`);

  const decisionCore = String(item.decision_number).split("(")[0].trim();
  if (!text.includes(decisionCore)) {
    notes.push(`رقم القرار ${decisionCore} غير ظاهر في نص الصفحة الرسمية`);
  }
  // عيّنات حرفية من المحتوى المخزَّن يجب أن تظهر في المصدر أو تكون مقتبسة بوضوح
  const quotes = [...String(item.content || "").matchAll(/«([^»]{12,80})»/g)].map((m) => m[1]);
  let quoteHits = 0;
  for (const q of quotes.slice(0, 3)) {
    if (text.includes(q.slice(0, 24)) || text.includes(q)) quoteHits += 1;
  }
  if (quotes.length > 0 && quoteHits === 0) {
    notes.push("لم تُعثر اقتباسات القرار في نص الصفحة الرسمية (قد يتغيّر HTML)");
  }

  const ok = notes.length === 0;
  results.push({ slug: item.slug, ok, notes });
  assert.equal(ok, true, `${item.slug}: ${notes.join("; ")}`);
}

console.log(
  JSON.stringify(
    {
      validated: results.length,
      items: results.map((r) => ({
        slug: r.slug,
        decision: items.find((i) => i.slug === r.slug)?.decision_number,
        source_url: items.find((i) => i.slug === r.slug)?.source_url,
        ok: r.ok,
      })),
    },
    null,
    2,
  ),
);
console.log("fiqh-council-source-validation: OK");
