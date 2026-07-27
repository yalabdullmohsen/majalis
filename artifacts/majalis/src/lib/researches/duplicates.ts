import { normalizeArabic } from "@/lib/arabic-search";
import type { ResearchRecord } from "./types";

export interface DuplicateCandidate {
  aId: string;
  bId: string;
  reasons: string[];
  score: number;
}

function normTitle(t: string): string {
  return normalizeArabic(t).replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function authorKey(r: ResearchRecord): string {
  return r.authors
    .map((a) => normalizeArabic(a.name))
    .sort()
    .join("|");
}

/** اكتشاف تكرار عبر DOI / عنوان / باحث+سنة / تشابه عنوان. */
export function findDuplicateCandidates(records: ResearchRecord[], minScore = 60): DuplicateCandidate[] {
  const out: DuplicateCandidate[] = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      const reasons: string[] = [];
      let score = 0;

      if (a.doi && b.doi && normalizeArabic(a.doi) === normalizeArabic(b.doi)) {
        reasons.push("نفس DOI");
        score += 100;
      }
      const ta = normTitle(a.title);
      const tb = normTitle(b.title);
      if (ta && ta === tb) {
        reasons.push("نفس العنوان");
        score += 70;
      } else if (ta.length > 12 && tb.length > 12 && (ta.includes(tb) || tb.includes(ta))) {
        reasons.push("تشابه عنوان");
        score += 45;
      }
      if (authorKey(a) && authorKey(a) === authorKey(b) && a.year && a.year === b.year) {
        reasons.push("نفس الباحث والسنة");
        score += 40;
      }
      if (a.filePath && b.filePath && a.filePath === b.filePath) {
        reasons.push("نفس بصمة/مسار الملف");
        score += 90;
      }
      if (score >= minScore && reasons.length) {
        out.push({ aId: a.id, bId: b.id, reasons, score });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

export function isLikelyDuplicateOf(candidate: ResearchRecord, existing: ResearchRecord[]): ResearchRecord | null {
  const hits = findDuplicateCandidates([candidate, ...existing], 70);
  const hit = hits.find((h) => h.aId === candidate.id || h.bId === candidate.id);
  if (!hit) return null;
  const otherId = hit.aId === candidate.id ? hit.bId : hit.aId;
  return existing.find((r) => r.id === otherId) ?? null;
}
