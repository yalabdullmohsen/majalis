import { useMemo } from "react";
import type { ReferenceWord } from "@/lib/recitation-ai/types";

export type RevealState = "hidden" | "revealed" | "error";

export type WordRevealInfo = {
  word: ReferenceWord;
  state: RevealState;
};

type Props = {
  words: WordRevealInfo[];
  revealGranularity: "word" | "ayah";
  /** الآية التي اكتملت للتوّ — تُستخدَم للمسة الذهبية على رأس الآية. */
  justCompletedAyah?: number | null;
};

/**
 * وضع "المصحف التفاعلي" (القسم 2، الوضع 4) — الجوهر البصري للميزة.
 * تُعرض الكلمات في ترتيبها الطبيعي دومًا (لا تحريك، لا إعادة تخطيط)؛
 * الكلمات غير المنطوقة بعد تُعرض بطبقة تمويه عاجية ناعمة (blur)، وتنكشف
 * فور نطقها الصحيح بحركة fade-in هادئة (≤150ms، عبر CSS transition لا JS).
 *
 * ⚠️ حدود صادقة: هذا **ليس** استنساخًا لتخطيط سطور مصحف المدينة الحقيقي
 * (لا توجد صور صفحات مصحف مربوطة بموضع كل كلمة بدقة بكسل في هذا المشروع
 * — راجع نتيجة الاستكشاف في التقرير النهائي) بل تدفّق نصي بالرسم العثماني
 * الحقيقي (من نفس مصدر public/data/quran/ الموثوق) مقسَّمًا آية آية بخط
 * Amiri Quran بحجم كبير يحاكي تجربة القراءة، لا نسخة طبق الأصل من صفحة
 * مطبوعة. تحسين مستقبلي محتمل إن توفرت بيانات إحداثيات كلمات لكل صفحة.
 */
export function InteractiveMushafReveal({ words, revealGranularity, justCompletedAyah }: Props) {
  const byAyah = useMemo(() => {
    const map = new Map<number, WordRevealInfo[]>();
    for (const w of words) {
      const key = w.word.ayah;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return [...map.entries()];
  }, [words]);

  return (
    <div className="imr-page" dir="rtl" role="group" aria-label="صفحة المصحف التفاعلية">
      {byAyah.map(([ayahNum, ayahWords]) => {
        const ayahRevealed = revealGranularity === "ayah" && ayahWords.every((w) => w.state !== "hidden");
        return (
          <span className="imr-ayah" key={ayahNum}>
            {ayahWords.map((w, idx) => (
              <span
                key={`${w.word.surah}:${w.word.ayah}:${w.word.wordIndex}`}
                className={[
                  "imr-word",
                  revealGranularity === "word" ? `imr-word--${w.state}` : ayahRevealed ? "imr-word--revealed" : "imr-word--hidden",
                  w.state === "error" ? "imr-word--pulse-error" : "",
                ].join(" ").trim()}
              >
                {w.word.raw}
                {idx < ayahWords.length - 1 ? " " : ""}
              </span>
            ))}
            <span
              className={`imr-ayah-mark ${justCompletedAyah === ayahNum ? "imr-ayah-mark--glow" : ""}`}
              aria-label={`نهاية الآية ${ayahNum}`}
            >
              ﴿{toArabicDigits(ayahNum)}﴾
            </span>
          </span>
        );
      })}
    </div>
  );
}

function toArabicDigits(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/[0-9]/g, (d) => digits[Number(d)]);
}
