import { Ornament } from "./Ornament";

export type CondolenceForm = {
  name: string;
  deathDate: string;
  burialTime: string;
  condolencePlace: string;
  extraText: string;
  size: "square" | "story";
};

export const defaultCondolenceForm: CondolenceForm = {
  name: "",
  deathDate: "",
  burialTime: "",
  condolencePlace: "",
  extraText: "",
  size: "square",
};

export const CARD_FONT =
  '"Amiri", "Scheherazade New", "Noto Naskh Arabic", serif';

export const VERSE_INNA = "\u0625\u0646\u0627 \u0644\u0644\u0647 \u0648\u0625\u0646\u0627 \u0625\u0644\u064a\u0647 \u0631\u0627\u062c\u0639\u0648\u0646";

export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1350 },
} as const;

type Props = {
  form: CondolenceForm;
  width: number;
  height: number;
  className?: string;
};

export function CondolenceCard({ form, width, height, className = "" }: Props) {
  const hasDetails = form.deathDate || form.burialTime || form.condolencePlace;

  return (
    <div
      className={`cond-bw-card relative overflow-hidden bg-black text-white shadow-2xl ${className}`}
      style={{
        width,
        height,
        fontFamily: CARD_FONT,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-6 border border-white/25" />
      <div className="pointer-events-none absolute left-8 top-8 h-16 w-16 border-l border-t border-white/50" />
      <div className="pointer-events-none absolute right-8 top-8 h-16 w-16 border-r border-t border-white/50" />
      <div className="pointer-events-none absolute bottom-8 left-8 h-16 w-16 border-b border-l border-white/50" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-16 w-16 border-b border-r border-white/50" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
        <p className="cond-bw-verse-top mb-3 font-bold leading-tight tracking-wide">
          وبشر الصابرين
        </p>
        <p className="cond-bw-verse-mid mb-6 leading-relaxed">
          الذين إذا أصابتهم مصيبة قالوا
        </p>
        <p className="cond-bw-hero mb-8 font-black leading-[1.25]">
          {VERSE_INNA}
        </p>

        <Ornament />

        {form.name.trim() && (
          <div className="mt-7 space-y-2">
            <p className="cond-bw-transition text-white/80">انتقل إلى رحمة الله تعالى</p>
            <p className="cond-bw-name font-bold leading-snug">{form.name.trim()}</p>
          </div>
        )}

        {hasDetails && (
          <div className="cond-bw-meta mt-6 leading-relaxed text-white/85">
            {form.deathDate && <p>الوفاة: {form.deathDate}</p>}
            {form.burialTime && <p>الدفن: {form.burialTime}</p>}
            {form.condolencePlace && <p>{form.condolencePlace}</p>}
          </div>
        )}

        {form.extraText.trim() && (
          <p className="cond-bw-extra mt-5 max-w-[80%] leading-relaxed text-white/75">
            {form.extraText.trim()}
          </p>
        )}

        <Ornament small />
      </div>
    </div>
  );
}
