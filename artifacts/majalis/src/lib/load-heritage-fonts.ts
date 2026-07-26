/**
 * تحميل كسول لخطوط التراث/القراءة العربية من Google Fonts.
 * تُستدعى من صفحات المصحف/القراءة/العناوين التراثية فقط — لا من المسار الحرج.
 */
const HERITAGE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap";

const LINK_ID = "majalis-heritage-fonts";

let loading: Promise<void> | null = null;

export function loadHeritageFonts(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.getElementById(LINK_ID)) return loading ?? Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = HERITAGE_FONTS_HREF;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

  return loading;
}
