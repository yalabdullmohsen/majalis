import { forwardRef, useMemo } from "react";
import {
  CONDOLENCE_AYAH,
  CONDOLENCE_BISMILLAH,
  CONDOLENCE_CLOSING,
  CONDOLENCE_DUA,
  CONDOLENCE_FONT_SIZES,
  CONDOLENCE_INTRO,
  CONDOLENCE_MIDDLE,
  CONDOLENCE_SADAQ,
} from "@/lib/condolence-content";
import { fitFontSize } from "@/lib/condolence-shared";

export type CondolenceForm = {
  familyName: string;
  name: string;
  extraText: string;
  size: "square" | "story";
  showLogo: boolean;
};

export const defaultCondolenceForm: CondolenceForm = {
  familyName: "",
  name: "",
  extraText: "",
  size: "story",
  showLogo: false,
};

export { EXPORT_SIZES } from "@/lib/condolence-shared";

type Props = {
  form: CondolenceForm;
  width: number;
  height: number;
  preview?: boolean;
  className?: string;
};

function IslamicOrnament({ flip }: { flip?: boolean }) {
  return (
    <svg
      className={`cond-card__ornament${flip ? " cond-card__ornament--flip" : ""}`}
      viewBox="0 0 976 32"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d="M488 0 L496 8 L488 16 L480 8 Z M440 16 L448 24 L440 32 L432 24 Z M536 16 L544 24 L536 32 L528 24 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.55"
      />
      <line x1="32" y1="16" x2="408" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <line x1="568" y1="16" x2="944" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      <circle cx="488" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

export const CondolenceCard = forwardRef<HTMLDivElement, Props>(function CondolenceCard(
  { form, width, height, preview = false, className = "" },
  ref,
) {
  const scale = width / 1080;
  const isSquare = height / width < 1.15;

  const familyDisplay = form.familyName.trim() || "………………";
  const nameDisplay = form.name.trim() || "………………";

  const familyFont = useMemo(
    () => fitFontSize(familyDisplay, CONDOLENCE_FONT_SIZES.family, 28, 22, 48),
    [familyDisplay],
  );

  const nameFont = useMemo(
    () => fitFontSize(nameDisplay, CONDOLENCE_FONT_SIZES.deceased, 38, 14, 42),
    [nameDisplay],
  );

  const closingFont = isSquare
    ? Math.min(CONDOLENCE_FONT_SIZES.closing, 64)
    : CONDOLENCE_FONT_SIZES.closing;

  return (
    <div
      ref={ref}
      className={[
        "cond-card",
        preview ? "cond-card--preview" : "",
        isSquare ? "cond-card--square" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width,
        height,
        ["--cond-scale" as string]: scale,
        ["--cond-family-size" as string]: `${familyFont}px`,
        ["--cond-name-size" as string]: `${nameFont}px`,
        ["--cond-closing-size" as string]: `${closingFont}px`,
      }}
      dir="rtl"
    >
      <div className="cond-card__bg" aria-hidden="true" />
      <div className="cond-card__frame" aria-hidden="true" />

      <div className="cond-card__inner">
        <header className="cond-card__top">
          <IslamicOrnament />
          <p className="cond-card__bismillah">{CONDOLENCE_BISMILLAH}</p>
          <p className="cond-card__ayah">{CONDOLENCE_AYAH}</p>
          <p className="cond-card__sadaq">{CONDOLENCE_SADAQ}</p>
        </header>

        <section className="cond-card__body">
          <p className="cond-card__intro">{CONDOLENCE_INTRO}</p>
          <p className="cond-card__family">{familyDisplay}</p>
          <p className="cond-card__middle">{CONDOLENCE_MIDDLE}</p>
          <p className="cond-card__name">{nameDisplay}</p>
          <p className="cond-card__dua">{CONDOLENCE_DUA}</p>
          {form.extraText.trim() ? (
            <p className="cond-card__extra">{form.extraText.trim()}</p>
          ) : null}
        </section>

        <footer className="cond-card__bottom">
          <IslamicOrnament flip />
          <p className="cond-card__closing">{CONDOLENCE_CLOSING}</p>
        </footer>

        {form.showLogo ? (
          <img src="/logo.png" alt="" className="cond-card__logo" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
});
