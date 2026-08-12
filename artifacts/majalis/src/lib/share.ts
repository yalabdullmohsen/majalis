/**
 * مشاركة موحّدة — تستخدم Web Share API إن توفرت، وإلا تنسخ للحافظة.
 * النص الديني يُمرَّر من المستدعي حرفياً بلا تعديل.
 */
export async function shareContent(options: {
  type: "ayah" | "dhikr" | "fawaid" | "lesson";
  text: string;        // النص الأصلي حرفياً بالتشكيل الكامل
  reference: string;   // "البقرة: 255" أو "أذكار الصباح"
  url?: string;
}): Promise<"shared" | "copied" | "error"> {
  const shareText = `${options.text}\n\n— ${options.reference}`;
  try {
    if (navigator.share) {
      await navigator.share({
        text: shareText,
        url: options.url,
      });
      return "shared";
    }
    // Fallback: نسخ للحافظة
    await navigator.clipboard.writeText(shareText);
    return "copied";
  } catch {
    return "error";
  }
}
