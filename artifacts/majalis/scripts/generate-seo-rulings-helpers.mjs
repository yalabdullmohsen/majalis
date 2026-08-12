import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

function evidenceListHtml(title, items) {
  if (!Array.isArray(items) || !items.length) return "";
  const lis = items
    .map((ev) => {
      const text = ev.text || ev.quote || "";
      const source = ev.source ? ` — <em>${escapeHtml(ev.source)}</em>` : "";
      return `<li>${escapeHtml(text)}${source}</li>`;
    })
    .join("");
  return `<h2>${escapeHtml(title)}</h2><ul>${lis}</ul>`;
}

export function rulingRichBody(row) {
  const parts = [];
  if (row.summary) {
    parts.push(`<p><strong>تصوير المسألة:</strong> ${escapeHtml(row.summary)}</p>`);
  }
  if (row.body) {
    parts.push(`<h2>الحكم</h2><p>${inlineMd(row.body)}</p>`);
  }
  parts.push(evidenceListHtml("الدليل من القرآن", row.quran_evidence));
  parts.push(evidenceListHtml("الدليل من السنة", row.sunnah_evidence));
  parts.push(evidenceListHtml("الأدلة", row.evidence));
  if (Array.isArray(row.scholar_opinions) && row.scholar_opinions.length) {
    const lis = row.scholar_opinions
      .map((op) => `<li><strong>${escapeHtml(op.scholar)}:</strong> ${escapeHtml(op.opinion)}</li>`)
      .join("");
    parts.push(`<h2>أقوال العلماء</h2><ul>${lis}</ul>`);
  }
  if (row.prevailing_view) {
    parts.push(`<h2>الراجح</h2><p>${escapeHtml(row.prevailing_view)}</p>`);
  }
  parts.push(evidenceListHtml("المصادر والمراجع", row.references));
  const metaBits = [
    row.category ? `التصنيف: ${row.category}` : "",
    row.subcategory ? `الباب: ${row.subcategory}` : "",
    row.verification_status ? `حالة المراجعة: ${row.verification_status}` : "",
    row.updated_at || row.reviewed_at ? `آخر مراجعة: ${row.updated_at || row.reviewed_at}` : "",
  ].filter(Boolean);
  if (metaBits.length) {
    parts.push(`<p>${escapeHtml(metaBits.join(" · "))}</p>`);
  }
  return parts.filter(Boolean).join("\n");
}

export async function loadEncyclopediaRulingsForSeo(appRoot) {
  const manifestPath = resolve(appRoot, "public/data/rulings-encyclopedia/manifest.json");
  if (!existsSync(manifestPath)) return [];
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const out = [];
  for (const chunk of manifest.chunks || []) {
    const file = resolve(appRoot, "public/data/rulings-encyclopedia", chunk.file);
    if (!existsSync(file)) continue;
    const rows = JSON.parse(await readFile(file, "utf8"));
    for (const row of rows) {
      const key = String(row.external_key || row.id || "");
      if (key.startsWith("qa-ruling") || key.startsWith("qa-")) continue;
      const title = String(row.title || "").trim();
      if (/[؟?]\s*$/u.test(title)) continue;
      if (/^(هل|كيف|متى|أين|لماذا|كم)\b/u.test(title)) continue;
      if (!row.body || !String(row.body).trim()) continue;
      out.push(row);
    }
  }
  return out;
}
