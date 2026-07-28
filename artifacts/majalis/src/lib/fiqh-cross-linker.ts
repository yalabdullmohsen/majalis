/**
 * Comparative Fiqh & Reference Cross-Linker Engine.
 * Links Fiqh rulings with Quranic verses, Hadith evidence, and Matn commentary.
 * Serves dynamic reference payloads for zero-layout-impact hooks.
 */

import type { EvidenceRef } from "@/lib/platform-types";
import type { RulingRelationLink, ShariaRulingExtended } from "@/lib/rulings-types";
import { buildRulingRelations, groupRelations } from "@/lib/rulings-relations";
import { RULINGS_ENCYCLOPEDIA_SEED } from "@/lib/rulings-data-loader";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type CrossLinkKind = "quran" | "hadith" | "matn" | "ruling" | "fiqh" | "qa" | "lesson" | "fawaid";

export type FiqhCrossReference = {
  kind: CrossLinkKind;
  id: string;
  title: string;
  text?: string;
  source?: string;
  href: string;
  meta?: string;
};

export type FiqhCrossLinkPayload = {
  rulingId: string;
  rulingTitle: string;
  quran: FiqhCrossReference[];
  hadith: FiqhCrossReference[];
  matn: FiqhCrossReference[];
  related: FiqhCrossReference[];
  grouped: Record<string, RulingRelationLink[]>;
  generatedAt: string;
};

function evidenceToRef(ev: EvidenceRef, fallbackKind: CrossLinkKind): FiqhCrossReference {
  const type = (ev.type || "").toLowerCase();
  let kind: CrossLinkKind = fallbackKind;
  if (type.includes("quran") || type.includes("ayah") || type.includes("verse")) kind = "quran";
  else if (type.includes("hadith") || type.includes("sunnah")) kind = "hadith";
  else if (type.includes("matn") || type.includes("book")) kind = "matn";

  const href =
    ev.url ||
    (kind === "quran"
      ? `/quran-hub?q=${encodeURIComponent(ev.text.slice(0, 40))}`
      : kind === "hadith"
        ? `/hadith?q=${encodeURIComponent(ev.source || ev.text.slice(0, 40))}`
        : `/library?q=${encodeURIComponent(ev.source || ev.text.slice(0, 40))}`);

  return {
    kind,
    id: `${kind}-${hashLite(ev.text + (ev.source || ""))}`,
    title: ev.source || (kind === "quran" ? "آية" : kind === "hadith" ? "حديث" : "متن"),
    text: ev.text,
    source: ev.source,
    href,
    meta: ev.type,
  };
}

function hashLite(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function collectEvidence(ruling: ShariaRulingExtended): FiqhCrossReference[] {
  const out: FiqhCrossReference[] = [];
  const bags: Array<{ list?: EvidenceRef[] | null; kind: CrossLinkKind }> = [
    { list: ruling.quran_evidence, kind: "quran" },
    { list: ruling.sunnah_evidence, kind: "hadith" },
    { list: ruling.evidence, kind: "hadith" },
  ];
  for (const bag of bags) {
    for (const ev of bag.list || []) {
      if (!ev?.text?.trim()) continue;
      out.push(evidenceToRef(ev, bag.kind));
    }
  }
  // Free-text / EvidenceRef references → matn-ish
  for (const ref of ruling.references || []) {
    if (typeof ref === "string") {
      if (!ref.trim()) continue;
      out.push({
        kind: "matn",
        id: `matn-${hashLite(ref)}`,
        title: "مرجع / متن",
        text: ref,
        href: `/library?q=${encodeURIComponent(ref.slice(0, 48))}`,
        meta: "reference",
      });
    } else if (ref?.text?.trim()) {
      out.push(evidenceToRef(ref, "matn"));
    }
  }
  return out;
}

function relationToCross(link: RulingRelationLink): FiqhCrossReference {
  return {
    kind: (link.type as CrossLinkKind) || "ruling",
    id: link.id,
    title: link.title,
    href: link.href,
    meta: link.meta,
  };
}

/** Build a full cross-link payload for a ruling. */
export function buildFiqhCrossLinkPayload(ruling: ShariaRulingExtended): FiqhCrossLinkPayload {
  const evidence = collectEvidence(ruling);
  const quran = evidence.filter((e) => e.kind === "quran");
  const hadith = evidence.filter((e) => e.kind === "hadith");
  const matn = evidence.filter((e) => e.kind === "matn");
  const relations = buildRulingRelations(ruling);
  const related = relations.map(relationToCross);

  return {
    rulingId: ruling.id,
    rulingTitle: ruling.title,
    quran,
    hadith,
    matn,
    related,
    grouped: groupRelations(relations),
    generatedAt: new Date().toISOString(),
  };
}

export function getFiqhCrossLinkById(rulingId: string): FiqhCrossLinkPayload | null {
  try {
    const ruling = RULINGS_ENCYCLOPEDIA_SEED.find((r) => r.id === rulingId || r.slug === rulingId);
    if (!ruling) return null;
    return buildFiqhCrossLinkPayload(ruling);
  } catch {
    return null;
  }
}

/** Search rulings whose evidence text matches a query; return cross-link payloads. */
export function searchFiqhCrossLinks(query: string, limit = 8): FiqhCrossLinkPayload[] {
  try {
    const q = normalizeArabic(query.trim());
    if (!q) return [];
    const all = RULINGS_ENCYCLOPEDIA_SEED;
    const hits: FiqhCrossLinkPayload[] = [];
    for (const r of all) {
      const hay = normalizeArabic(
        [
          r.title,
          r.summary,
          r.body,
          ...(r.keywords || []),
          ...(r.quran_evidence || []).map((e) => e.text),
          ...(r.sunnah_evidence || []).map((e) => e.text),
          ...(r.references || []).map((e) => (typeof e === "string" ? e : e.text)),
        ]
          .filter(Boolean)
          .join(" "),
      );
      if (!hay.includes(q)) continue;
      hits.push(buildFiqhCrossLinkPayload(r));
      if (hits.length >= limit) break;
    }
    return hits;
  } catch {
    return [];
  }
}

/** Flat list of all references for a ruling (hook-friendly). */
export function flattenFiqhReferences(payload: FiqhCrossLinkPayload): FiqhCrossReference[] {
  return [...payload.quran, ...payload.hadith, ...payload.matn, ...payload.related];
}
