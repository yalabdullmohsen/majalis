export type KnowledgeDetailField = {
  label: string;
  value: unknown;
};

export type KnowledgeDetailSection = {
  id: string;
  title: string;
  prose?: string;
  items?: string[];
  fields?: KnowledgeDetailField[];
  quote?: string;
  /** يُستخدم في الواجهة فقط؛ وجوده يعني أن القسم غير فارغ */
  hasChildren?: boolean;
  variant?: "default" | "quote" | "related" | "overview";
};

/** لا يعرض قسمًا فارغًا ولا يحجز مساحة لحقل غير موجود. */
export function hasKnowledgeDetailContent(
  section: KnowledgeDetailSection & { children?: unknown },
): boolean {
  if (section.children != null || section.hasChildren) return true;
  if (section.prose?.trim()) return true;
  if (section.quote?.trim()) return true;
  if (section.items && section.items.length > 0) return true;
  if (
    section.fields &&
    section.fields.some((f) => f.value != null && String(f.value).trim() !== "")
  ) {
    return true;
  }
  return false;
}
