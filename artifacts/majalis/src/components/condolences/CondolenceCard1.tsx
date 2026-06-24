import type { CondolenceCardProps } from "./types";
import { CornerOrnaments, CrescentDivider } from "./svg-shared";

/** تصميم 1 — الكلاسيكي الداكن: كحلي عميق مع إطار ذهبي وزوايا زخرفية */
export function CondolenceCard1({ data, id }: CondolenceCardProps) {
  return (
    <article
      id={id}
      dir="rtl"
      className="condolence-design condolence-design-1 relative mx-auto flex flex-col items-center justify-between overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 600,
        aspectRatio: "2 / 3",
        background: "#1a1a2e",
        border: "1px solid #d4af37",
        fontFamily: "'Scheherazade New', 'Amiri', serif",
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
        <CornerOrnaments />
      </svg>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <p className="mb-4 text-[clamp(1.75rem,5vw,3rem)] font-bold leading-relaxed text-[#d4af37]">
          إنا لله وإنا إليه راجعون
        </p>

        <CrescentDivider />

        <p className="mt-6 text-lg text-[#d4af37]/80">انتقل إلى رحمة الله تعالى</p>
        <h2 className="mt-3 text-[clamp(1.5rem,4vw,2.25rem)] font-bold text-[#f5f0e8]">{data.deceasedName}</h2>

        <CrescentDivider color="#d4af3788" />

        <dl className="mt-6 space-y-2 text-base text-[#d4af37]/90">
          <div><dt className="inline opacity-70">تاريخ الوفاة: </dt><dd className="inline">{data.deathDate}</dd></div>
          <div><dt className="inline opacity-70">العائلة: </dt><dd className="inline">{data.familyName}</dd></div>
          {data.condolenceTime && (
            <div><dt className="inline opacity-70">وقت العزاء: </dt><dd className="inline">{data.condolenceTime}</dd></div>
          )}
          {data.condolenceLocation && (
            <div><dt className="inline opacity-70">مكان العزاء: </dt><dd className="inline">{data.condolenceLocation}</dd></div>
          )}
        </dl>

        <p className="mt-8 text-xl italic text-[#d4af37]">{data.prayer}</p>
      </div>
    </article>
  );
}
