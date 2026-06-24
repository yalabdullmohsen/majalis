import type { CondolenceCardProps } from "./types";
import { IslamicWatermark } from "./svg-shared";

/** تصميم 2 — الأبيض الأرجواني الفاخر: مربع أبيض مع watermark هندسي */
export function CondolenceCard2({ data, id }: CondolenceCardProps) {
  return (
    <article
      id={id}
      dir="rtl"
      className="condolence-design condolence-design-2 relative mx-auto flex flex-col items-center justify-center overflow-hidden bg-white"
      style={{
        width: "100%",
        maxWidth: 700,
        aspectRatio: "1 / 1",
        border: "3px solid #6b21a8",
        fontFamily: "'Scheherazade New', 'Amiri', serif",
      }}
    >
      <IslamicWatermark />

      <div className="relative z-10 flex w-full flex-col items-center px-10 py-12 text-center">
        <p className="text-[clamp(2rem,5.5vw,3.25rem)] font-bold leading-[1.6] text-[#1e1b4b]">
          إنا لله وإنا إليه راجعون
        </p>
        <div className="my-5 h-px w-32 bg-gradient-to-l from-transparent via-[#d4af37] to-transparent" />

        <p className="text-lg text-[#6b21a8]/80">انتقل إلى رحمة الله تعالى</p>
        <h2 className="mt-4 text-[clamp(1.4rem,3.5vw,2rem)] font-bold text-[#1e1b4b]">{data.deceasedName}</h2>

        <div className="my-6 w-full max-w-md space-y-2 border-y border-[#6b21a8]/15 py-5 text-[#1e1b4b]/85">
          <p><span className="text-[#6b21a8]">تاريخ الوفاة:</span> {data.deathDate}</p>
          <p><span className="text-[#6b21a8]">العائلة:</span> {data.familyName}</p>
          {data.condolenceTime && <p><span className="text-[#6b21a8]">وقت العزاء:</span> {data.condolenceTime}</p>}
          {data.condolenceLocation && <p><span className="text-[#6b21a8]">المكان:</span> {data.condolenceLocation}</p>}
        </div>

        <p className="text-xl text-[#6b21a8]">{data.prayer}</p>
      </div>
    </article>
  );
}
