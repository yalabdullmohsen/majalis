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

export const THULUTH_FONT =
  '"Amiri Quran", "Amiri", "Scheherazade New", "Noto Naskh Arabic", serif';

export const BODY_FONT =
  '"Amiri", "Scheherazade New", "Noto Naskh Arabic", serif';

export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080, previewW: 432, previewH: 432 },
  story: { width: 1080, height: 1350, previewW: 432, previewH: 540 },
} as const;

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

  const detailRows = [
    form.day.trim() ? { label: "اليوم", value: form.day.trim() } : null,
    form.deathDate.trim() ? { label: "التاريخ", value: form.deathDate.trim() } : null,
    form.burialTime.trim() ? { label: "وقت الدفن", value: form.burialTime.trim() } : null,
    form.condolencePlace.trim() ? { label: "مكان العزاء", value: form.condolencePlace.trim() } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      ref={ref}
      className={`cond-card ${preview ? "cond-card--preview" : ""} ${className}`.trim()}
      style={{
        width,
        height,
        ["--cond-scale" as string]: scale,
      }}
      dir="rtl"
    >
      <div className="cond-card__bg" aria-hidden="true" />
      <div className="cond-card__frame" aria-hidden="true" />

      <div className="cond-card__inner">
        <header className="cond-card__header">
          <p className="cond-card__intro-top">وبشر الصابرين</p>
          <p className="cond-card__intro-mid">الذين إذا أصابتهم مصيبة قالوا</p>
        </header>

        <div className="cond-card__hero-zone">
          <p className="cond-card__hero">{VERSE_INNA}</p>
        </div>

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
