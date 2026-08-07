/** أنواع مشتركة للكيانات — تُوسَّع في E من مخطّطات Zod/Supabase. */
export type EntitySlug = string;

export type EntityRef = {
  kind: string;
  slug: EntitySlug;
  titleAr: string;
};
