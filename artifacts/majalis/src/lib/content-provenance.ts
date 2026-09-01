/**
 * حوكمة المصادر والتراخيص — حقول موحّدة للمحتوى الشرعي الظاهر للعامة.
 */

export type ContentProvenance = {
  sourceName?: string | null;
  sourceUrl?: string | null;
  reference?: string | null;
  license?: string | null;
  usageNote?: string | null;
  reviewed?: boolean;
  lastVerifiedAt?: string | null;
  /** يُعلَّم داخليًا — لا يُعرض في الواجهة العامة */
  needsSource?: boolean;
  publicDomain?: boolean;
  hostedBySsunnah?: boolean;
};

export type HadithProvenanceFields = {
  book?: string | number | null;
  number?: string | number | null;
  narrator?: string | null;
  grade?: string | null;
  gradeSource?: string | null;
};

/** يستخرج اسم مصدر صالح للعرض العام. */
export function resolveSourceName(input: {
  sourceName?: string | null;
  source?: string | null;
  author_name?: string | null;
  author?: string | null;
  title?: string | null;
  reference?: string | null;
}): string | null {
  const direct =
    input.sourceName?.trim() ||
    input.source?.trim() ||
    input.reference?.trim() ||
    input.author_name?.trim() ||
    null;
  if (direct) return direct;
  const author = input.author?.trim();
  const title = input.title?.trim();
  if (author && title) return `${author} — ${title}`;
  return author || title || null;
}

/** هل للمحتوى مصدر كافٍ للعرض العام؟ */
export function hasPublicSource(input: {
  sourceName?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  reference?: string | null;
  author_name?: string | null;
  author?: string | null;
  title?: string | null;
  needsSource?: boolean;
  documentation_status?: string | null;
  trust_level?: string | null;
}): boolean {
  if (input.needsSource) return false;
  if (input.documentation_status === "unsourced" && !input.reference?.trim()) return false;
  if (input.trust_level === "unsourced" && !input.reference?.trim() && !input.source?.trim()) {
    return false;
  }
  const name = resolveSourceName(input);
  if (!name) return false;
  // «السنة النبوية» وحده لا يكفي لحديث محدد
  if (/^السنة\s*النبوية$/i.test(name) && !input.reference?.trim()) return false;
  return true;
}

/** يُستخدم في الفلترة الداخلية */
export function markNeedsSource(record: { needsSource?: boolean } & Parameters<typeof hasPublicSource>[0]): boolean {
  return record.needsSource === true || !hasPublicSource(record);
}

export function filterPubliclySourced<T extends Parameters<typeof hasPublicSource>[0]>(items: T[]): T[] {
  return items.filter((item) => hasPublicSource(item));
}

/** noindex مؤقت لصفحات تعتمد على محتوى ناقص المصدر */
export function shouldNoindexForSourceGap(input: Parameters<typeof hasPublicSource>[0]): boolean {
  return markNeedsSource(input);
}
