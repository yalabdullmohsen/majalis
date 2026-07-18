import { Fragment, useMemo } from "react";
import type { ReferenceWord } from "@/lib/recitation-ai/types";

export type RevealState = "hidden" | "revealed" | "error" | "unclear" | "needs_repeat";

export type WordRevealInfo = {
  word: ReferenceWord;
  state: RevealState;
};

type Props = {
  words: WordRevealInfo[];
  /**
   * "word": كشف تدريجي كلمة كلمة (الافتراضي). "ayah": الآية كاملة تُكشَف
   * دفعة واحدة عند إتمامها. "page" (المرحلة السادسة، الوضع الثالث
   * الناقص — TASMEE_AUDIT.md): **لا يُكشَف أي نص إطلاقًا طوال الجلسة** —
   * فقط تظليل `.imr-ayah--recited` الدائم القائم أصلاً يبقى مؤشر التقدم
   * الوحيد على مواضع الآيات المُسمَّعة، بلا أي كشف كلمات أو نبضات خطأ قد
   * تُسرِّب معلومة عن الموضع.
   */
  revealGranularity: "word" | "ayah" | "page";
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
 *
 * ⚠️ إصلاح خلل تباعد حقيقي (2026-07-18): كانت المسافة الفاصلة بين
 * الكلمات تُدرَج **داخل** عنصر `<span>` الكلمة نفسه (نص لاحق) بدل أن
 * تكون عقدة نصية منفصلة بين عنصرين — مع `text-align: justify` على
 * الحاوية، لا يتعرّف محرك التنسيق دومًا على هذه المسافة كنقطة تبرير
 * صالحة فتُهمَل عمليًا (قياس مباشر أثبت تلامس الكلمات ببعضها ببُعد صفري)،
 * بينما تتراكم كل مساحة التبرير عند نقطة واحدة (علامة نهاية الآية) —
 * فتبدو الكلمات متلاصقة والفراغ الوحيد كتلة كبيرة غير طبيعية عند كل آية.
 * الإصلاح: المسافة الآن عقدة نصية شقيقة مستقلة بعد كل span، لا محتوى
 * داخله — تُعامَل بشكل طبيعي وصحيح من خوارزمية التبرير.
 *
 * حالة "آية مُسمَّعة" الدائمة (TASMEE_AUDIT.md القسم 5 بند 2): تُحسَب من
 * `words` نفسها — آية بلا أي كلمة "hidden" (أي حُسمت كل كلماتها، بصرف
 * النظر عن كونها صحيحة/خطأ/غير واضحة) تُعامَل كـ"مُسمَّعة"، وتبقى مُظلَّلة
 * طوال الجلسة (لا تختفي بعد لحظات كتوهّج `justCompletedAyah` العابر —
 * ذاك يبقى لمسة ذهبية إضافية *مؤقتة* فوق التظليل الدائم عند إتمام الآية
 * للتوّ تحديدًا، لا بديلًا عنه).
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
        const ayahRecited = ayahWords.every((w) => w.state !== "hidden");
        return (
          <span
            className={`imr-ayah ${ayahRecited ? "imr-ayah--recited" : ""}`}
            key={ayahNum}
          >
            {ayahWords.map((w, idx) => (
              <Fragment key={`${w.word.surah}:${w.word.ayah}:${w.word.wordIndex}`}>
                <span
                  className={[
                    "imr-word",
                    revealGranularity === "page"
                      ? "imr-word--hidden"
                      : revealGranularity === "word"
                        ? `imr-word--${w.state}`
                        : ayahRevealed ? "imr-word--revealed" : "imr-word--hidden",
                    revealGranularity !== "page" && w.state === "error" ? "imr-word--pulse-error" : "",
                    revealGranularity !== "page" && w.state === "unclear" ? "imr-word--pulse-unclear" : "",
                    revealGranularity !== "page" && w.state === "needs_repeat" ? "imr-word--pulse-needs-repeat" : "",
                  ].join(" ").trim()}
                >
                  {w.word.raw}
                </span>
                {idx < ayahWords.length - 1 ? " " : ""}
              </Fragment>
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
