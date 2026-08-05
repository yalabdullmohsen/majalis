/**
 * مشاركة موحّدة — تستخدم Web Share API إن توفرت، وإلا تنسخ للحافظة.
 * النص الديني يُمرَّر من المستدعي حرفياً بلا تعديل.
 */
export async function shareContent(options: {
  type: "ayah" | "dhikr" | "fawaid" | "lesson" | "hadith" | "quiz";
  text: string;        // النص الأصلي حرفياً بالتشكيل الكامل
  reference: string;   // "البقرة: 255" أو "أذكار الصباح"
  url?: string;
}): Promise<"shared" | "copied" | "error"> {
  const shareText = `${options.text}\n\n— ${options.reference}\nhttps://majlisilm.com`;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({
        text: shareText,
        url: options.url,
      });
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        options.url ? `${shareText}\n${options.url}` : shareText,
      );
      return "copied";
    }
    return "error";
  } catch (err) {
    // إلغاء المستخدم من ورقة المشاركة الأصلية ليس خطأً للمستخدم
    if (err instanceof DOMException && err.name === "AbortError") return "error";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          options.url ? `${shareText}\n${options.url}` : shareText,
        );
        return "copied";
      }
    } catch {
      /* fall through */
    }
    return "error";
  }
}
