/**
 * انحدار جولة الأحكام/التواصل/المكتبة بعد بوابة النشر.
 * node --import tsx src/lib/__tests__/rulings-index-empty-and-integrity.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditRulingPublicationRows,
  isPubliclyPublishedRuling,
} from "../rulings-publication-gate.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadEncyclopediaRows() {
  const manifestPath = resolve(root, "public/data/rulings-encyclopedia/manifest.json");
  assert.ok(existsSync(manifestPath), "manifest الأحكام موجود");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const rows = [];
  for (const chunk of manifest.chunks || []) {
    const file = resolve(root, "public/data/rulings-encyclopedia", chunk.file);
    if (!existsSync(file)) continue;
    rows.push(...JSON.parse(readFileSync(file, "utf8")));
  }
  return rows;
}

const rows = loadEncyclopediaRows();
const audit = auditRulingPublicationRows(rows);
const pendingReview = rows.filter((r) => {
  const v = String(r.verification_status || "").toLowerCase().replace(/-/g, "_");
  const s = String(r.status || "").toLowerCase().replace(/-/g, "_");
  return v === "pending_review" || s === "pending_review";
}).length;

console.log(
  JSON.stringify(
    {
      total: audit.total,
      draft: audit.draft,
      needs_review: audit.needs_review,
      pending_review: pendingReview,
      approved: audit.approved,
      published: audit.published,
      archived: audit.archived,
      incomplete: audit.incomplete,
      orphaned: audit.orphaned,
      publicEligible: audit.publicEligible,
    },
    null,
    2,
  ),
);

assert.equal(audit.publicEligible, rows.filter((r) => isPubliclyPublishedRuling(r)).length);

// لا اعتماد آلي: لا نُحوّل pending إلى public في الاختبار
for (const r of rows) {
  if (String(r.verification_status).includes("pending")) {
    assert.equal(isPubliclyPublishedRuling(r), false, `pending ليس عاماً: ${r.id || r.title}`);
  }
}

const view = readFileSync(resolve(root, "src/pages/fiqh/ui/RulingsView.tsx"), "utf8");
assert.match(
  view,
  /يجري حاليًا استكمال المراجعة العلمية لمواد الموسوعة/,
  "Empty State صادقة عند غياب المنشور",
);
assert.doesNotMatch(view, /pending_review/, "الواجهة لا تعرض pending_review للعامة");

const seo = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
assert.match(seo, /يجري حاليًا استكمال المراجعة العلمية لمواد الموسوعة/);
assert.match(seo, /ENCYCLOPEDIA_RULINGS\.length/);
assert.doesNotMatch(seo, /المصدر قيد الإضافة/);
assert.match(seo, /mailto:\$\{escapeHtml\(SITE\.contactEmail\)\}/, "SSR التواصل يتضمن البريد الرسمي");

const contact = readFileSync(resolve(root, "src/views/ContactPage.tsx"), "utf8");
assert.match(contact, /CONTACT_EMAIL/);
assert.match(contact, /mailtoWithSubject/);

const site = JSON.parse(readFileSync(resolve(root, "site.config.json"), "utf8"));
assert.ok(String(site.contactEmail || "").includes("@"), "بريد رسمي في site.config");

// prerender: لا pending_review في HTML الأحكام
const prerenderDir = resolve(root, "seo-prerender/rulings");
if (existsSync(prerenderDir)) {
  let hits = 0;
  for (const name of readdirSync(prerenderDir)) {
    const htmlPath = join(prerenderDir, name, "index.html");
    if (!existsSync(htmlPath)) continue;
    const html = readFileSync(htmlPath, "utf8");
    if (/pending_review/i.test(html)) hits += 1;
  }
  assert.equal(hits, 0, "لا prerender يعرض pending_review");
}

console.log("rulings-index-empty-and-integrity.test.ts: ok");
