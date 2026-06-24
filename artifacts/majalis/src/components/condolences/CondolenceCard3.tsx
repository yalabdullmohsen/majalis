import type { CondolenceCardProps } from "./types";
import { EightPointStar } from "./svg-shared";

/** تصميم 3 — الرمادي الدمشقي: أفقي مع إطار مزدوج ونجمة ثمانية */
export function CondolenceCard3({ data, id }: CondolenceCardProps) {
  return (
    <article
      id={id}
      dir="rtl"
      className="condolence-design condolence-design-3 relative mx-auto overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 900,
        aspectRatio: "3 / 2",
        background: "radial-gradient(ellipse at center, #2d2d2d 0%, #1a1a1a 100%)",
        fontFamily: "'Scheherazade New', 'Amiri', serif",
        boxShadow: "inset 0 0 0 2px #888, inset 0 0 0 5px rgba(255,255,255,0.12)",
      }}
    >
      <div className="flex h-full flex-col items-center justify-center px-10 py-8 text-center">
        <p className="text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-relaxed text-[#f5f0e8]">
          إنا لله وإنا إليه راجعون
        </p>

        <div className="my-4 flex w-full max-w-lg items-center gap-3">
          <div className="h-px flex-1 bg-[#d4af37]/50" />
          <EightPointStar />
          <div className="h-px flex-1 bg-[#d4af37]/50" />
        </div>

        <h2 className="text-[clamp(1.25rem,3vw,1.85rem)] font-bold text-[#e8c872]">{data.deceasedName}</h2>
        <p className="mt-1 text-lg text-[#e8c872]/85">{data.familyName}</p>

        <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-1 text-sm text-[#f5f0e8]/80 sm:grid-cols-2 sm:gap-x-8">
          <p><span className="text-[#e8c872]">تاريخ الوفاة:</span> {data.deathDate}</p>
          {data.condolenceTime && <p><span className="text-[#e8c872]">وقت العزاء:</span> {data.condolenceTime}</p>}
          {data.condolenceLocation && (
            <p className="sm:col-span-2"><span className="text-[#e8c872]">مكان العزاء:</span> {data.condolenceLocation}</p>
          )}
        </div>

        <p className="mt-5 text-lg italic text-[#e8c872]">{data.prayer}</p>
      </div>
    </article>
  );
}
