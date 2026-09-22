/**
 * Identity Reset PR-2: الشريط المتحرك (محتوى يومي) على الرئيسية فقط.
 * الصفحات الداخلية لا تدفع المحتوى بتيكّر ثابت.
 */
export function isHomeChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/";
}

/** أي مسار غير الرئيسية = هادئ (بلا تيكّر هيدر). */
export function isTickerQuietPath(pathname: string): boolean {
  return !isHomeChromePath(pathname);
}

/** صف بحث كامل في الهيدر؟ لا — الرئيسية لها HUS وصفحة البحث واجهتها؛ الهيدر أيقونة فقط. */
export function shouldShowHeaderSearchRow(_pathname: string): boolean {
  return false;
}

/** التيكر في الهيدر: الرئيسية فقط. */
export function shouldShowHeaderTicker(pathname: string): boolean {
  return isHomeChromePath(pathname);
}
