/**
 * صفحة التعريف عند أول زيارة — تظهر مرة واحدة على الرئيسية فقط.
 *
 * التحكم: غيّر `enabled` إلى `false` لتعطيل الصفحة والدخول مباشرة للرئيسية.
 */
export type FirstVisitIntroConfig = {
  /** false = لا تُعرض صفحة التعريف نهائيًا */
  enabled: boolean;
};

export const firstVisitIntroConfig: FirstVisitIntroConfig = {
  enabled: true,
};
