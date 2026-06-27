import type { RulingImportRow, RulingValidationResult, ShariaRulingExtended } from "./rulings-types";

function normalizeText(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[ًٌٍَُِّْٰ]/g, "")
    .trim()
    .toLowerCase();
}

export function hasEvidence(ruling: Partial<ShariaRulingExtended>): boolean {
  const pools = [
    ruling.evidence,
    ruling.quran_evidence,
    ruling.sunnah_evidence,
    ruling.references,
  ];
  return pools.some((p) => Array.isArray(p) && p.length > 0);
}

export function hasReference(ruling: Partial<ShariaRulingExtended>): boolean {
  if (Array.isArray(ruling.references) && ruling.references.length > 0) return true;
  const pools = [ruling.evidence, ruling.quran_evidence, ruling.sunnah_evidence];
  return pools.some((p) => Array.isArray(p) && p.some((e) => e.source || e.url));
}

export function validateRuling(
  ruling: Partial<ShariaRulingExtended>,
  existing: ShariaRulingExtended[] = [],
): RulingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ruling.title?.trim()) errors.push("العنوان مطلوب");
  if (!ruling.body?.trim()) errors.push("التفصيل الكامل مطلوب");
  if (!ruling.category?.trim()) errors.push("التصنيف مطلوب");
  if (!hasEvidence(ruling) && !hasReference(ruling)) {
    errors.push("يجب توثيق الدليل أو المرجع");
  }
  if (!ruling.summary?.trim()) warnings.push("الوصف المختصر غير موجود");

  const titleNorm = normalizeText(ruling.title ?? "");
  if (titleNorm) {
    const dup = existing.find(
      (r) =>
        r.id !== ruling.id &&
        (normalizeText(r.title) === titleNorm ||
          (ruling.external_key && r.external_key === ruling.external_key)),
    );
    if (dup) warnings.push(`حكم مشابه: «${dup.title}»`);
  }

  for (const ref of ruling.references ?? []) {
    if (ref.url && !/^https?:\/\//i.test(ref.url)) {
      warnings.push(`رابط مرجع غير صالح: ${ref.url}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateImportBatch(
  rows: RulingImportRow[],
): { valid: RulingImportRow[]; invalid: { row: RulingImportRow; errors: string[] }[] } {
  const valid: RulingImportRow[] = [];
  const invalid: { row: RulingImportRow; errors: string[] }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const titleKey = normalizeText(row.title ?? "");
    const dupInBatch = titleKey && seen.has(titleKey);
    if (titleKey) seen.add(titleKey);

    const result = validateRuling(row, valid as ShariaRulingExtended[]);
    const errors = [...result.errors];
    if (dupInBatch) errors.push("تكرار في ملف الاستيراد");

    if (errors.length === 0) valid.push(row);
    else invalid.push({ row, errors });
  }

  return { valid, invalid };
}

export function findSimilarRulings(
  ruling: Partial<ShariaRulingExtended>,
  pool: ShariaRulingExtended[],
  threshold = 0.85,
): ShariaRulingExtended[] {
  const title = normalizeText(ruling.title ?? "");
  if (!title) return [];

  return pool.filter((r) => {
    if (r.id === ruling.id) return false;
    const other = normalizeText(r.title);
    if (!other) return false;
    if (other === title) return true;
    const shorter = title.length < other.length ? title : other;
    const longer = title.length >= other.length ? title : other;
    return longer.includes(shorter) && shorter.length / longer.length >= threshold;
  });
}

export function dedupeRulings(items: ShariaRulingExtended[]): ShariaRulingExtended[] {
  const out: ShariaRulingExtended[] = [];
  const keys = new Set<string>();

  for (const item of items) {
    const key = item.external_key || normalizeText(item.title);
    if (keys.has(key)) continue;
    keys.add(key);
    out.push(item);
  }
  return out;
}
