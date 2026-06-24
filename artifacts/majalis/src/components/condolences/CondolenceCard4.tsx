import type { CondolenceCardProps } from "./types";
import { DottedGoldBorder } from "./svg-shared";

/** تصميم 4 — الخضراء الإسلامية: أخضر داكن مع شريط بيانات سفلي */
export function CondolenceCard4({ data, id }: CondolenceCardProps) {
  return (
    <article
      id={id}
      dir="rtl"
      className="condolence-design condolence-design-4 relative mx-auto flex flex-col overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 600,
        aspectRatio: "2 / 3",
        background: "#0d4a2a",
        fontFamily: "'Scheherazade New', 'Amiri', serif",
      }}
    >
      <DottedGoldBorder />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <p
          className="text-[clamp(1.75rem,5vw,3rem)] font-bold leading-relaxed text-white"
          style={{ textShadow: "0 2px 12px rgba(212,175,55,0.55), 0 0 2px #d4af37" }}
        >
          إنا لله وإنا إليه راجعون
        </p>
        <p className="mt-6 text-base text-white/70">انتقل إلى رحمة الله تعالى</p>
        <p className="mt-8 text-xl text-white/90">{data.prayer}</p>
      </div>

      <footer
        className="relative z-10 px-6 py-5 text-center"
        style={{ background: "rgba(20,90,55,0.92)" }}
      >
        <h2 className="text-[clamp(1.25rem,3.5vw,1.75rem)] font-bold text-[#f5f0e8]">{data.deceasedName}</h2>
        <p className="mt-2 text-base text-[#d4af37]">{data.familyName}</p>
        <div className="mt-3 space-y-1 text-sm text-white/85">
          <p>{data.deathDate}</p>
          {data.condolenceTime && <p>{data.condolenceTime}</p>}
          {data.condolenceLocation && <p>{data.condolenceLocation}</p>}
        </div>
      </footer>
    </article>
  );
}
