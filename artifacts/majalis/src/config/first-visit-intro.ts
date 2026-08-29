/**
 * صفحة التعريف عند أول زيارة — معطّلة نهائيًا لاستقرار أول إطار.
 * الملف والاختبارات تبقى للمراجع؛ لا تُعرض شاشة ترحيب تسويقية عند الإقلاع.
 */
export type FirstVisitIntroConfig = {
  /** false = لا تُعرض صفحة التعريف نهائيًا */
  enabled: boolean;
};

export const firstVisitIntroConfig: FirstVisitIntroConfig = {
  enabled: false,
};
