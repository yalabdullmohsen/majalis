/**
 * Hadith Authentication & Cross-Reference Engine.
 * Parses authenticity grades + primary source attribution from Azkar/Matn
 * text fields. Logic-only — no UI.
 */

import { ADHKAR_ITEMS, type AdhkarItem } from "@/lib/adhkar-seed";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type AuthenticityGrade =
  | "sahih"
  | "hasan"
  | "daif"
  | "mawdu"
  | "mukhtalaf"
  | "unknown";

export type PrimaryHadithSource =
  | "bukhari"
  | "muslim"
  | "tirmidhi"
  | "abu_dawud"
  | "nasai"
  | "ibn_majah"
  | "ahmad"
  | "malik"
  | "hakim"
  | "other"
  | "unknown";

export type HadithAuthRecord = {
  id: string;
  origin: "adhkar" | "matn" | "free_text";
  grade: AuthenticityGrade;
  gradeLabelAr: string;
  primarySource: PrimaryHadithSource;
  sourceLabelAr: string;
  rawSource?: string;
  rawGrade?: string;
  narrator?: string;
  reference?: string;
  confidence: number; // 0–1
};

export type HadithAuthLookupResult = {
  record: HadithAuthRecord | null;
  matchedBy: "id" | "text" | "none";
};

const GRADE_LABELS: Record<AuthenticityGrade, string> = {
  sahih: "صحيح",
  hasan: "حسن",
  daif: "ضعيف",
  mawdu: "موضوع",
  mukhtalaf: "مختلف فيه",
  unknown: "غير محدد",
};

const SOURCE_LABELS: Record<PrimaryHadithSource, string> = {
  bukhari: "البخاري",
  muslim: "مسلم",
  tirmidhi: "الترمذي",
  abu_dawud: "أبو داود",
  nasai: "النسائي",
  ibn_majah: "ابن ماجه",
  ahmad: "أحمد",
  malik: "مالك",
  hakim: "الحاكم",
  other: "مصدر آخر",
  unknown: "غير معروف",
};

const GRADE_PATTERNS: Array<{ grade: AuthenticityGrade; re: RegExp }> = [
  { grade: "sahih", re: /صحيح|sahih/i },
  { grade: "hasan", re: /حسن|hasan/i },
  { grade: "mawdu", re: /موضوع|mawdu|fabricat/i },
  { grade: "daif", re: /ضعيف|da'?if|weak/i },
  { grade: "mukhtalaf", re: /مختلف|مختَلف/i },
];

const SOURCE_PATTERNS: Array<{ source: PrimaryHadithSource; re: RegExp }> = [
  { source: "bukhari", re: /البخاري|بخاري|bukhari/i },
  { source: "muslim", re: /مسلم(?!\s*بن)|muslim/i },
  { source: "tirmidhi", re: /الترمذي|ترمذي|tirmidh/i },
  { source: "abu_dawud", re: /أبو\s*داود|ابو\s*داود|أبي\s*داود|abu\s*dawud/i },
  { source: "nasai", re: /النسائي|نسائي|nasa'?i/i },
  { source: "ibn_majah", re: /ابن\s*ماجه|ابن\s*ماجة|ibn\s*majah/i },
  { source: "ahmad", re: /أحمد|مسند\s*أحمد|ahmad/i },
  { source: "malik", re: /الموطأ|مالك|malik/i },
  { source: "hakim", re: /الحاكم|حاكم|hakim/i },
];

export function parseAuthenticityGrade(raw?: string | null): AuthenticityGrade {
  if (!raw) return "unknown";
  for (const { grade, re } of GRADE_PATTERNS) {
    if (re.test(raw)) return grade;
  }
  return "unknown";
}

export function parsePrimarySource(raw?: string | null): PrimaryHadithSource {
  if (!raw) return "unknown";
  for (const { source, re } of SOURCE_PATTERNS) {
    if (re.test(raw)) return source;
  }
  // "رواه الشيخان" / متفق عليه → treat as both; prefer bukhari as primary
  if (/الشيخان|متفق\s*عليه|الصحيحين/i.test(raw)) return "bukhari";
  if (/رواه|أخرجه|في\s*سنن|في\s*صحيح/i.test(raw)) return "other";
  return "unknown";
}

export function authenticityLabelAr(grade: AuthenticityGrade): string {
  return GRADE_LABELS[grade];
}

export function primarySourceLabelAr(source: PrimaryHadithSource): string {
  return SOURCE_LABELS[source];
}

function confidenceFor(grade: AuthenticityGrade, source: PrimaryHadithSource): number {
  let c = 0.35;
  if (grade !== "unknown") c += 0.35;
  if (source !== "unknown" && source !== "other") c += 0.3;
  else if (source === "other") c += 0.1;
  return Math.min(1, Math.round(c * 100) / 100);
}

export function annotateAdhkarItem(item: AdhkarItem): HadithAuthRecord {
  const grade = parseAuthenticityGrade(item.grade || item.source);
  const primarySource = parsePrimarySource(item.source || item.reference);
  return {
    id: item.id,
    origin: "adhkar",
    grade,
    gradeLabelAr: authenticityLabelAr(grade),
    primarySource,
    sourceLabelAr: primarySourceLabelAr(primarySource),
    rawSource: item.source,
    rawGrade: item.grade,
    narrator: item.narrator,
    reference: item.reference,
    confidence: confidenceFor(grade, primarySource),
  };
}

/** Annotate free matn / hadith text blob with optional grade/source hints. */
export function annotateMatnText(
  id: string,
  text: string,
  hints?: { grade?: string; source?: string; narrator?: string },
): HadithAuthRecord {
  const blob = [hints?.grade, hints?.source, text.slice(0, 240)].filter(Boolean).join(" | ");
  const grade = parseAuthenticityGrade(hints?.grade || blob);
  const primarySource = parsePrimarySource(hints?.source || blob);
  return {
    id,
    origin: "matn",
    grade,
    gradeLabelAr: authenticityLabelAr(grade),
    primarySource,
    sourceLabelAr: primarySourceLabelAr(primarySource),
    rawSource: hints?.source,
    rawGrade: hints?.grade,
    narrator: hints?.narrator,
    confidence: confidenceFor(grade, primarySource),
  };
}

let adhkarIndex: Map<string, HadithAuthRecord> | null = null;
let textIndex: Array<{ norm: string; record: HadithAuthRecord }> | null = null;

function ensureAdhkarIndex(): void {
  if (adhkarIndex) return;
  adhkarIndex = new Map();
  textIndex = [];
  for (const item of ADHKAR_ITEMS) {
    const rec = annotateAdhkarItem(item);
    adhkarIndex.set(item.id, rec);
    const norm = normalizeArabic(item.text).slice(0, 80);
    if (norm.length >= 12) textIndex.push({ norm, record: rec });
  }
}

/** Build / refresh lightweight in-memory index (safe to call from bootstrap). */
export function warmHadithAuthIndex(): number {
  adhkarIndex = null;
  textIndex = null;
  ensureAdhkarIndex();
  return adhkarIndex?.size ?? 0;
}

export function lookupAdhkarAuth(id: string): HadithAuthLookupResult {
  ensureAdhkarIndex();
  const record = adhkarIndex!.get(id) ?? null;
  return { record, matchedBy: record ? "id" : "none" };
}

export function lookupByTextSnippet(snippet: string): HadithAuthLookupResult {
  ensureAdhkarIndex();
  const nq = normalizeArabic(snippet).slice(0, 80);
  if (nq.length < 10) return { record: null, matchedBy: "none" };
  for (const row of textIndex!) {
    if (row.norm.includes(nq) || nq.includes(row.norm.slice(0, 40))) {
      return { record: row.record, matchedBy: "text" };
    }
  }
  return { record: null, matchedBy: "none" };
}

/** Unified background lookup by id or free text. */
export function lookupHadithAuth(query: {
  id?: string;
  text?: string;
  gradeHint?: string;
  sourceHint?: string;
}): HadithAuthLookupResult {
  if (query.id) {
    const byId = lookupAdhkarAuth(query.id);
    if (byId.record) return byId;
  }
  if (query.text) {
    const byText = lookupByTextSnippet(query.text);
    if (byText.record) return byText;
    if (query.gradeHint || query.sourceHint) {
      return {
        record: annotateMatnText(query.id || "free", query.text, {
          grade: query.gradeHint,
          source: query.sourceHint,
        }),
        matchedBy: "text",
      };
    }
  }
  return { record: null, matchedBy: "none" };
}

export function listAdhkarByGrade(grade: AuthenticityGrade, limit = 50): HadithAuthRecord[] {
  ensureAdhkarIndex();
  const out: HadithAuthRecord[] = [];
  for (const rec of adhkarIndex!.values()) {
    if (rec.grade === grade) {
      out.push(rec);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function listAdhkarBySource(source: PrimaryHadithSource, limit = 50): HadithAuthRecord[] {
  ensureAdhkarIndex();
  const out: HadithAuthRecord[] = [];
  for (const rec of adhkarIndex!.values()) {
    if (rec.primarySource === source) {
      out.push(rec);
      if (out.length >= limit) break;
    }
  }
  return out;
}
