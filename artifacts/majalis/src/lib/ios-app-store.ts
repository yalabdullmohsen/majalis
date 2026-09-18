/**
 * رابط App Store الرسمي لتطبيق سُنّة على الآيفون.
 * اتركه فارغًا حتى النشر الرسمي — عندها ضع رابط apps.apple.com فقط (لا TestFlight).
 * الثابت الفارغ يسمح بحذف دعوات التحميل من الحزمة (DCE) قبل النشر.
 */
export const IOS_APP_STORE_URL = "";

/** يقبل فقط روابط App Store العامة (لا TestFlight). */
export function isProductionAppStoreUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host !== "apps.apple.com" && host !== "itunes.apple.com") return false;
    if (/testflight/i.test(u.pathname + u.search)) return false;
    return /\/app\//i.test(u.pathname) || /\/id\d+/i.test(u.pathname);
  } catch {
    return false;
  }
}

export function hasIosAppStoreUrl(): boolean {
  return IOS_APP_STORE_URL.length > 0 && isProductionAppStoreUrl(IOS_APP_STORE_URL);
}
