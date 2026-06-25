import { forwardRef } from "react";

export type CondolenceForm = {
  name: string;
  day: string;
  deathDate: string;
  burialTime: string;
  condolencePlace: string;
  extraText: string;
  size: "square" | "story";
  showLogo: boolean;
};

export const defaultCondolenceForm: CondolenceForm = {
  name: "",
  day: "",
  deathDate: "",
  burialTime: "",
  condolencePlace: "",
  extraText: "",
  size: "story",
  showLogo: false,
};

export const VERSE_INNA = "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ";

/** Thuluth-adjacent stack: Scheherazade / Amiri Quran first, then Ruqaa fallbacks */
export const THULUTH_FONT =
  '"Scheherazade New", "Amiri Quran", "Aref Ruqaa", "Amiri", "Noto Naskh Arabic", "IBM Plex Sans Arabic", serif';

export const BODY_FONT =
  '"Amiri", "Noto Naskh Arabic", "IBM Plex Sans Arabic", "Scheherazade New", serif';

export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080, previewW: 432, previewH: 432 },
  story: { width: 1080, height: 1350, previewW: 432, previewH: 540 },
} as const;

function CondOrnamentBanner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.55" strokeLinecap="round">
        <line x1="8" y1="9" x2="108" y2="9" opacity="0.55" />
        <line x1="172" y1="9" x2="272" y2="9" opacity="0.55" />
        <path
          d="M140 3.5 L142.2 7.5 L146.5 7.5 L143.2 10.2 L144.4 14.5 L140 12.2 L135.6 14.5 L136.8 10.2 L133.5 7.5 L137.8 7.5 Z"
          opacity="0.7"
        />
        <path
          d="M140 6.2 L141 8.2 L143.2 8.2 L141.6 9.6 L142.2 11.8 L140 10.6 L137.8 11.8 L138.4 9.6 L136.8 8.2 L139 8.2 Z"
          opacity="0.45"
        />
        <line x1="124" y1="9" x2="128" y2="9" opacity="0.35" />
        <line x1="152" y1="9" x2="156" y2="9" opacity="0.35" />
      </g>
    </svg>
  );
}

function CondOrnamentSep({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 6"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round">
        <line x1="4" y1="3" x2="58" y2="3" opacity="0.5" />
        <path d="M70 1.2 L71.2 3 L70 4.8 L68.8 3 Z" opacity="0.65" />
        <line x1="82" y1="3" x2="136" y2="3" opacity="0.5" />
      </g>
    </svg>
  );
}

type Props = {
  form: CondolenceForm;
  width: number;
  height: number;
  preview?: boolean;
  className?: string;
};

export const CondolenceCard = forwardRef<HTMLDivElement, Props>(function CondolenceCard(
  { form, width, height, preview = false, className = "" },
  ref,
) {
  const scale = width / 1080;
  const isCompact = height / width <= 1.05;

  const detailRows = [
    form.day.trim() ? { label: "اليوم", value: form.day.trim() } : null,
    form.deathDate.trim() ? { label: "التاريخ", value: form.deathDate.trim() } : null,
    form.burialTime.trim() ? { label: "وقت الدفن", value: form.burialTime.trim() } : null,
    form.condolencePlace.trim() ? { label: "مكان العزاء", value: form.condolencePlace.trim() } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      ref={ref}
      className={[
        "cond-card",
        preview ? "cond-card--preview" : "",
        isCompact ? "cond-card--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width,
        height,
        ["--cond-scale" as string]: scale,
      }}
      dir="rtl"
    >
      <div className="cond-card__frame" aria-hidden="true" />

      <div className="cond-card__inner">
        <CondOrnamentBanner className="cond-card__ornament cond-card__ornament--top" />

        <header className="cond-card__header">
          <p className="cond-card__intro-top">وبشر الصابرين</p>
          <p className="cond-card__intro-mid">الذين إذا أصابتهم مصيبة قالوا</p>
        </header>

        <div className="cond-card__hero-zone">
          <p className="cond-card__hero">{VERSE_INNA}</p>
        </div>

        <CondOrnamentSep className="cond-card__ornament cond-card__ornament--mid" />

        <div className="cond-card__main">
          <p className="cond-card__transition">انتقل إلى رحمة الله تعالى</p>

          {form.name.trim() ? (
            <p className="cond-card__name">{form.name.trim()}</p>
          ) : null}

          {detailRows.length > 0 ? (
            <dl className="cond-card__details">
              {detailRows.map((row) => (
                <div key={row.label} className="cond-card__detail-row">
                  <dt>{row.label}:</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {form.extraText.trim() ? (
            <p className="cond-card__extra">{form.extraText.trim()}</p>
          ) : null}
        </div>

        <footer className="cond-card__footer">
          <CondOrnamentBanner className="cond-card__ornament cond-card__ornament--bottom" />
          <div className="cond-card__divider" aria-hidden="true" />
          <p className="cond-card__dua">رحمه الله وأسكنه فسيح جناته</p>
        </footer>

        {form.showLogo ? (
          <img src="/logo.png" alt="" className="cond-card__logo" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
});
