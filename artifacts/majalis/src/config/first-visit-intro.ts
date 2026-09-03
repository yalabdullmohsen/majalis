/**
 * صفحة التعريف عند أول زيارة — تُعرض مرة واحدة عبر HomeView (كسولًا).
 * لا تُركَّب في App.tsx حتى لا تثقل مسار الإقلاع.
 */
export type FirstVisitIntroConfig = {
  /** true = تُعرض للمستخدم الجديد مرة واحدة على الرئيسية */
  enabled: boolean;
};

export const firstVisitIntroConfig: FirstVisitIntroConfig = {
  enabled: true,
};
