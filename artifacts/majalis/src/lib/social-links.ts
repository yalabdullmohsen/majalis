/**
 * روابط التواصل الاجتماعي المعتمدة للمنصة — مصدر وحيد.
 * أضِف هنا فقط، ولا تكتب رابط انستغرام أو غيره يدويًا في أي مكوّن آخر.
 */

/** اسم الحساب الرسمي كما يظهر للمستخدم. */
export const ACADEMY_NAME = "المجلس العلمي";

/** معرّف حساب انستغرام (بلا @). */
export const ACADEMY_INSTAGRAM_HANDLE = "Majlisalilm";

/** الرابط الآمن على متصفح الويب — يُستخدم كـ href الأساسي دائمًا (يعمل حتى بلا JavaScript). */
export const ACADEMY_INSTAGRAM_URL = `https://www.instagram.com/${ACADEMY_INSTAGRAM_HANDLE}`;

/** مخطط الفتح المباشر لتطبيق انستغرام (iOS/Android إن تثبَّت التطبيق). */
const ACADEMY_INSTAGRAM_APP_SCHEME = `instagram://user?username=${ACADEMY_INSTAGRAM_HANDLE}`;

/**
 * على iOS: نحاول فتح تطبيق انستغرام مباشرةً؛ فإن لم يكن مثبَّتًا (لم تتغيّر رؤية الصفحة
 * خلال المهلة) نعود تلقائيًا لفتح الرابط الآمن في المتصفح ضمن تبويب جديد
 * (`noopener,noreferrer`). على أي منصة أخرى نترك سلوك الرابط الافتراضي (href + target=_blank)
 * يعمل كما هو دون تدخّل.
 *
 * يُستدعى من onClick لعنصر <a> يملك بالفعل href={ACADEMY_INSTAGRAM_URL} target="_blank"
 * rel="noopener noreferrer" — فالتدهور الآمن (fallback) مضمون حتى لو فشل JavaScript.
 */
export function openInstagramAcademy(event?: { preventDefault: () => void }): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;

  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  if (!isIOSDevice) return; // اترك سلوك الرابط الافتراضي (فتح المتصفح الآمن في تبويب جديد)

  event?.preventDefault();

  const startedAt = Date.now();
  let fellBack = false;

  const openWebFallback = () => {
    if (fellBack || document.hidden) return; // إن غادر المستخدم الصفحة فالأرجح أن التطبيق فُتح فعليًا
    fellBack = true;
    window.open(ACADEMY_INSTAGRAM_URL, "_blank", "noopener,noreferrer");
  };

  window.setTimeout(() => {
    if (Date.now() - startedAt < 2000) openWebFallback();
  }, 900);

  window.location.href = ACADEMY_INSTAGRAM_APP_SCHEME;
}
