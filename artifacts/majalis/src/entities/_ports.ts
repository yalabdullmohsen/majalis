/**
 * واجهة مستودع كيان موحّدة (تُفعَّل في E).
 * الصفحات لا تعرف مصدر البيانات (JSON / Supabase).
 */
export type EntityRepository<T> = {
  getAll: () => Promise<T[]>;
  getBySlug: (slug: string) => Promise<T | null>;
  search: (query: string) => Promise<T[]>;
};

export type EntityCardProps = {
  titleAr: string;
  href: string;
  subtitleAr?: string;
};
