/**
 * Automated Semantic Tagging & Vault Search Engine.
 * Lightweight client-side tagging for notes/benefits (#Fiqh, #Tafseer, #Hadith…).
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import {
  listAllAnnotations,
  queryKnowledgeVault,
  upsertAnnotation,
  type PersonalAnnotation,
  type VaultQuery,
} from "@/lib/personal-knowledge-vault";

export type SemanticTag =
  | "Fiqh"
  | "Tafseer"
  | "Hadith"
  | "Aqeedah"
  | "Tazkiya"
  | "Quran"
  | "Adhkar"
  | "Seerah"
  | "Arabic"
  | "General";

export const SEMANTIC_TAG_RULES: Array<{ tag: SemanticTag; keywords: string[] }> = [
  { tag: "Fiqh", keywords: ["فقه", "حكم", "حلال", "حرام", "صلاة", "زكاة", "صيام", "حج", "طهارة", "وضوء", "نكاح"] },
  { tag: "Tafseer", keywords: ["تفسير", "تدبر", "آية", "سورة", "معنى الآية", "التأويل"] },
  { tag: "Hadith", keywords: ["حديث", "سنة", "رواه", "البخاري", "مسلم", "النووي", "إسناد"] },
  { tag: "Aqeedah", keywords: ["عقيدة", "توحيد", "شرك", "إيمان", "أسماء الله", "قدر"] },
  { tag: "Tazkiya", keywords: ["تزكية", "قلب", "رياء", "إخلاص", "تقوى", "ورع", "أخلاق"] },
  { tag: "Quran", keywords: ["قرآن", "مصحف", "تلاوة", "حفظ", "ورد", "ختمة"] },
  { tag: "Adhkar", keywords: ["ذكر", "أذكار", "تسبيح", "استغفار", "دعاء"] },
  { tag: "Seerah", keywords: ["سيرة", "غزوة", "صحابة", "النبي", "هجرة"] },
  { tag: "Arabic", keywords: ["نحو", "صرف", "لغة", "آجرومية", "إعراب"] },
];

export type TaggedDocument = {
  id: string;
  title?: string;
  body: string;
  tags: string[];
  suggestedTags: SemanticTag[];
  kind?: string;
};

/** Suggest semantic tags for free text (does not mutate storage). */
export function suggestSemanticTags(text: string, limit = 4): SemanticTag[] {
  try {
    const n = normalizeArabic(text);
    if (!n) return ["General"];
    const scored: Array<{ tag: SemanticTag; score: number }> = [];
    for (const rule of SEMANTIC_TAG_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        const kn = normalizeArabic(kw);
        if (kn && n.includes(kn)) score += 1;
      }
      if (score > 0) scored.push({ tag: rule.tag, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const tags = scored.slice(0, limit).map((s) => s.tag);
    return tags.length ? tags : ["General"];
  } catch {
    return ["General"];
  }
}

/** Merge suggested tags into annotation tags (unique, keep existing). */
export function mergeTags(existing: string[], suggested: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of [...existing, ...suggested]) {
    const clean = t.replace(/^#/, "").trim();
    if (!clean) continue;
    const key = normalizeArabic(clean);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

/** Auto-tag a vault annotation and persist. */
export async function autoTagAnnotation(annotationId: string): Promise<PersonalAnnotation | null> {
  const all = await listAllAnnotations();
  const hit = all.find((a) => a.id === annotationId);
  if (!hit) return null;
  const suggested = suggestSemanticTags([hit.title, hit.body].filter(Boolean).join("\n"));
  const tags = mergeTags(hit.tags, suggested);
  return upsertAnnotation({
    id: hit.id,
    kind: hit.kind,
    targetId: hit.targetId,
    title: hit.title,
    body: hit.body,
    tags,
  });
}

/** Auto-tag all vault items; returns count updated. */
export async function autoTagEntireVault(): Promise<number> {
  const all = await listAllAnnotations();
  let n = 0;
  for (const a of all) {
    const suggested = suggestSemanticTags([a.title, a.body].filter(Boolean).join("\n"));
    const tags = mergeTags(a.tags, suggested);
    if (tags.join("|") === a.tags.join("|")) continue;
    await upsertAnnotation({
      id: a.id,
      kind: a.kind,
      targetId: a.targetId,
      title: a.title,
      body: a.body,
      tags,
    });
    n += 1;
  }
  return n;
}

/** Tag-based vault query (#Fiqh / Fiqh / فقه alike). */
export async function searchVaultByTag(tag: string, limit = 50): Promise<PersonalAnnotation[]> {
  const clean = tag.replace(/^#/, "").trim();
  return queryKnowledgeVault({ tag: clean, limit });
}

export async function searchVaultSemantic(opts: {
  text?: string;
  tag?: string;
  kind?: VaultQuery["kind"];
  limit?: number;
}): Promise<TaggedDocument[]> {
  const rows = await queryKnowledgeVault({
    text: opts.text,
    tag: opts.tag?.replace(/^#/, ""),
    kind: opts.kind,
    limit: opts.limit ?? 50,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    tags: r.tags,
    suggestedTags: suggestSemanticTags([r.title, r.body].filter(Boolean).join("\n")),
    kind: r.kind,
  }));
}

export function listKnownSemanticTags(): SemanticTag[] {
  return SEMANTIC_TAG_RULES.map((r) => r.tag);
}
