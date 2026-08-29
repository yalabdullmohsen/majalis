/**
 * انحدار جولة الأحكام بعد أرشفة الموسوعة (2026-08-17).
 * node --import tsx src/lib/__tests__/rulings-index-empty-and-integrity.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditRulingPublicationRows,
  isPubliclyPublishedRuling,
} from "../rulings-publication-gate.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const archiveManifest = resolve(root, "content/archive/rulings-encyclopedia/data/manifest.json");
const archiveReadme = resolve(root, "content/archive/rulings-encyclopedia/README.md");

function loadArchivedRows() {
  assert.ok(existsSync(archiveManifest), "أرشيف الأحكام موجود");
  const manifest = JSON.parse(readFileSync(archiveManifest, "utf8"));
  const rows = [];
  for (const chunk of manifest.chunks || []) {
    const file = resolve(root, "content/archive/rulings-encyclopedia/data", chunk.file);
    if (!existsSync(file)) continue;
    rows.push(...JSON.parse(readFileSync(file, "utf8")));
  }
  return rows;
}

const rows = loadArchivedRows();
const audit = auditRulingPublicationRows(rows);

console.log(
  JSON.stringify(
    {
      archived: true,
      total: audit.total,
      publicEligible: audit.publicEligible,
      pending_review: rows.filter((r) => {
        const v = String(r.verification_status || "").toLowerCase().replace(/-/g, "_");
        const s = String(r.status || "").toLowerCase().replace(/-/g, "_");
        return v === "pending_review" || s === "pending_review";
      }).length,
    },
    null,
    2,
  ),
);

assert.equal(audit.publicEligible, 0, "لا محتوى عام في الأرشيف");
assert.ok(existsSync(archiveReadme), "README الأرشيف موجود");
assert.match(readFileSync(archiveReadme, "utf8"), /sharia_rulings/);

const appSrc = readFileSync(resolve(root, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
assert.match(appSrc, /path="\/rulings"><Redirect to="\/fiqh"/);
assert.match(appSrc, /path="\/rulings\/:id"><Redirect to="\/fiqh"/);

const seo = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
assert.doesNotMatch(seo, /المصدر قيد الإضافة/);
assert.match(seo, /mailto:\$\{escapeHtml\(SITE\.contactEmail\)\}/, "SSR التواصل يتضمن البريد الرسمي");

const contact = readFileSync(resolve(root, "src/views/ContactPage.tsx"), "utf8");
assert.match(contact, /CONTACT_EMAIL/);
assert.match(contact, /mailtoWithSubject/);

const site = JSON.parse(readFileSync(resolve(root, "site.config.json"), "utf8"));
assert.ok(String(site.contactEmail || "").includes("@"), "بريد رسمي في site.config");

for (const r of rows) {
  if (String(r.verification_status).includes("pending")) {
    assert.equal(isPubliclyPublishedRuling(r), false, `pending ليس عاماً: ${r.id || r.title}`);
  }
}

console.log("rulings-index-empty-and-integrity.test.ts: ok (archived)");
