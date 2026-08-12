/**
 * Citation Engine — strict source completeness for Islamic answers.
 */

import { createHash } from "node:crypto";

export const REQUIRED_CITATION_FIELDS = [
  "book_title",
  "internal_href",
];

export const ISLAMIC_SOURCE_FIELDS = [
  "author_name",
  "edition",
  "volume",
  "page",
  "chapter",
  "hadith_number",
  "ayah_ref",
  "hadith_grade",
  "verification",
];

function stableKey(parts) {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("|"))
    .digest("hex")
    .slice(0, 24);
}

export function normalizeCitation(raw = {}) {
  const kind = raw.content_kind || raw.kind || "content";
  const sourceName = raw.source_name || raw.publisher || raw.author || "المجلس العلمي";
  const title = raw.title || raw.book_title || raw.excerpt?.slice?.(0, 80) || "مادة موثقة";
  const href = raw.href || raw.internal_href || raw.source_url || "/search";

  const bookTitle =
    raw.book_title ||
    raw.book ||
    (kind === "quran" || kind === "ayah" ? "القرآن الكريم" : null) ||
    (kind === "hadith" || kind === "verified_hadith" ? raw.source_name : null) ||
    sourceName;

  return {
    citation_key: raw.citation_key || stableKey([kind, raw.ref_id, title, href]),
    title,
    content_ref_id: raw.ref_id || raw.content_ref_id || null,
    source_ref_id: raw.source_ref_id || null,
    book_title: bookTitle,
    author_name: raw.author_name || raw.author || raw.scholar || null,
    edition: raw.edition || raw.print_edition || null,
    volume: raw.volume || raw.juz || null,
    page: raw.page || raw.page_number || null,
    chapter: raw.chapter || raw.bab || null,
    hadith_number: raw.hadith_number || raw.number || null,
    ayah_ref: raw.ayah_ref || (kind === "quran" || kind === "ayah" ? raw.content_id : null),
    hadith_grade: raw.hadith_grade || raw.grade || null,
    verification: raw.verification || raw.verification_status || null,
    internal_href: href,
    source_url: raw.source_url || null,
    trust_level: Math.max(0, Math.min(100, Number(raw.trust_score || raw.trust_level || 80))),
    metadata: {
      content_kind: kind,
      tier: raw.tier,
      tier_label: raw.tier_label,
      excerpt: raw.excerpt || "",
      updated_at: raw.updated_at || null,
    },
  };
}

export function validateCitation(raw = {}) {
  const citation = normalizeCitation(raw);
  const missing = [];

  for (const field of REQUIRED_CITATION_FIELDS) {
    if (!citation[field]) missing.push(field);
  }

  const detailFieldsPresent = ISLAMIC_SOURCE_FIELDS.filter((field) => Boolean(citation[field]));
  const completeness = Math.min(
    100,
    Math.round(((REQUIRED_CITATION_FIELDS.length - missing.length + detailFieldsPresent.length) /
      (REQUIRED_CITATION_FIELDS.length + ISLAMIC_SOURCE_FIELDS.length)) * 100),
  );

  return {
    ok: missing.length === 0,
    citation: {
      ...citation,
      completeness_score: completeness,
      missing_fields: missing,
    },
    missing,
    completeness,
  };
}

export function buildCitationSet(citations = []) {
  const byKey = new Map();
  for (const raw of citations) {
    const validated = validateCitation(raw);
    if (!byKey.has(validated.citation.citation_key)) {
      byKey.set(validated.citation.citation_key, validated);
    }
  }
  const items = [...byKey.values()];
  return {
    ok: items.length > 0 && items.every((item) => item.ok),
    citations: items.map((item) => item.citation),
    missing: items.flatMap((item) => item.missing),
    average_completeness: items.length
      ? Math.round(items.reduce((sum, item) => sum + item.completeness, 0) / items.length)
      : 0,
  };
}

export async function persistCitations(admin, citations = []) {
  if (!admin || !citations.length) return { ok: true, persisted: 0, skipped: true };
  let persisted = 0;
  const errors = [];

  for (const raw of citations) {
    const { citation } = validateCitation(raw);
    try {
      const { error } = await admin
        .from("kg_citations")
        .upsert(citation, { onConflict: "citation_key" });
      if (error) throw error;
      persisted += 1;
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  return { ok: errors.length === 0, persisted, errors };
}
