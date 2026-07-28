/**
 * مشاركة آية: نسخ النص أو توليد صورة مصممة بـ Canvas.
 */
export {
  generateAyahImage,
  shareAyahAsImage,
  SHARE_CARD_THEMES,
  type ShareCardTheme,
  type ShareCardOptions,
} from "@/lib/share-ayah-card";

async function copyPlainText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

export async function copyAyahText(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  return copyPlainText(`${text} ﴿${ayahNum}﴾\n— سورة ${surahName}`);
}

/**
 * إزالة التشكيل فقط (الحركات، السكون، التنوين، المدّ...) دون أي تعديل آخر
 * على الحروف نفسها (لا توحيد للهمزات، لا حذف ألف خنجرية) — نسخة "قراءة
 * بلا تشكيل" أمينة للرسم العثماني الأصلي.
 */
export function stripArabicDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g, "");
}

export async function copyAyahTextPlain(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  return copyPlainText(`${stripArabicDiacritics(text)} ﴿${ayahNum}﴾\n— سورة ${surahName}`);
}

export async function shareAyahAsText(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  const formatted = `${text} ﴿${ayahNum}﴾\n— سورة ${surahName}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: formatted, title: `آية ${ayahNum} — سورة ${surahName}` });
      return true;
    } catch {
      /* المستخدم أغلق أو فشلت — نسخ النص */
    }
  }
  return copyPlainText(formatted);
}
