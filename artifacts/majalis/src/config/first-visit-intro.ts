/**
 * صفحة التعريف عند أول زيارة — تظهر مرة واحدة على الرئيسية فقط.
 *
 * التحكم: غيّر `enabled` إلى `false` لتعطيل الصفحة على الويب.
 * التطبيق الأصلي (Capacitor) يتخطى التعريف دائمًا — انظر first-visit-intro-state.
 */
export type FirstVisitIntroConfig = {
  /** false = لا تُعرض صفحة التعريف نهائيًا */
  enabled: boolean;
};

export const firstVisitIntroConfig: FirstVisitIntroConfig = {
  enabled: false,
};
