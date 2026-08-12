/**
 * مصدر واحد لنقطة انقطاع التنقّل.
 *
 * السبب: كانت في المستودع ثلاث قيم متعارضة — 768 في hooks/use-mobile.tsx،
 * و879 في NavBar.tsx، و879/880 في CSS (‎.bottom-nav‎). النتيجة نطاق
 * 769–879px يظهر فيه الشريط السفلي *و* شريط الأقسام العلوي معًا، فيتكرّر
 * نفس التنقّل مرتين ويضيع ارتفاع من الشاشة.
 *
 * القاعدة: `MOBILE_NAV_MAX_WIDTH` هي بالتحديد أقصى عرض يكون فيه الشريط
 * السفلي هو التنقّل الأساسي (‎@media (max-width: 879px)‎ في
 * styles/final-release.css). أي مكوّن تنقّل يقرأ منها لا من رقم مكتوب يدويًا.
 */
export const MOBILE_NAV_MAX_WIDTH = 879;

export const MOBILE_NAV_MEDIA_QUERY = `(max-width: ${MOBILE_NAV_MAX_WIDTH}px)`;

/** true حين يكون الشريط السفلي هو التنقّل الأساسي (بلا SSR crash). */
export function isMobileNavViewport(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(MOBILE_NAV_MEDIA_QUERY).matches;
  }
  return window.innerWidth <= MOBILE_NAV_MAX_WIDTH;
}
