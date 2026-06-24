import {
  CircleOrnaments,
  CornerFrames,
  CrescentSvg,
  DividerLine,
  IslamicPatternBg,
} from "./decorations";
import type { CondolenceFormData, CondolencePreviewProps, CondolenceTemplateId } from "./types";

const ARABIC_FONT = "'Amiri', 'Scheherazade New', 'Traditional Arabic', 'Arial', serif";
const VERSE_INNA = "إنا لله وإنا إليه راجعون";

function headlineForTemplate(templateId: CondolenceTemplateId): string {
  switch (templateId) {
    case "baqiya_lillah":
      return "البقاء لله";
    case "bashshir_sabireen":
      return "وبشر الصابرين";
    case "official_death":
      return "إعلان وفاة";
    default:
      return VERSE_INNA;
  }
}

function DetailsBlock({ data }: { data: CondolenceFormData }) {
  const hasDetails = data.deathDate || data.burialTime || data.condolenceLocation;
  if (!hasDetails && !data.extraText) return null;

  return (
    <div className="cond-details">
      {data.deathDate && (
        <p>
          <span>تاريخ الوفاة</span>
          <strong>{data.deathDate}</strong>
        </p>
      )}
      {data.burialTime && (
        <p>
          <span>وقت الدفن</span>
          <strong>{data.burialTime}</strong>
        </p>
      )}
      {data.condolenceLocation && (
        <p>
          <span>مكان العزاء</span>
          <strong>{data.condolenceLocation}</strong>
        </p>
      )}
      {data.extraText && <p className="cond-extra">{data.extraText}</p>}
    </div>
  );
}

function DeceasedName({ name, large }: { name: string; large?: boolean }) {
  const display = name.trim() || "........";
  return (
    <p className={large ? "cond-name cond-name--large" : "cond-name"}>{display}</p>
  );
}

function TemplateBlackClassic({ data, headline }: { data: CondolenceFormData; headline: string }) {
  return (
    <>
      <IslamicPatternBg />
      <svg className="cond-corner-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <CornerFrames />
      </svg>
      <div className="cond-inner cond-inner--classic">
        <p className="cond-headline">{headline}</p>
        <DividerLine />
        <p className="cond-sub">انتقل إلى رحمة الله تعالى</p>
        <DeceasedName name={data.deceasedName} />
        <DetailsBlock data={data} />
        <DividerLine />
        <p className="cond-footer-verse">رحمه الله وأسكنه فسيح جناته</p>
      </div>
    </>
  );
}

function TemplateCircleOrnament({ data, headline }: { data: CondolenceFormData; headline: string }) {
  return (
    <>
      <CircleOrnaments />
      <IslamicPatternBg />
      <div className="cond-inner cond-inner--circle">
        <p className="cond-headline cond-headline--sm">{headline}</p>
        <div className="cond-circle-frame">
          <div className="cond-circle-frame__ring" aria-hidden="true" />
          <div className="cond-circle-frame__content">
            <p className="cond-sub">رحمه الله</p>
            <DeceasedName name={data.deceasedName} large />
          </div>
        </div>
        <DetailsBlock data={data} />
      </div>
    </>
  );
}

function TemplateLargeArabic({ data, headline }: { data: CondolenceFormData; headline: string }) {
  return (
    <>
      <IslamicPatternBg />
      <div className="cond-inner cond-inner--large">
        <p className="cond-hero-text">{headline}</p>
        <DeceasedName name={data.deceasedName} large />
        <DetailsBlock data={data} />
      </div>
    </>
  );
}

function TemplateOfficialDeath({ data }: { data: CondolenceFormData }) {
  return (
    <>
      <IslamicPatternBg />
      <div className="cond-inner cond-inner--official">
        <div className="cond-official-badge">إعلان وفاة</div>
        <p className="cond-headline cond-headline--sm">{VERSE_INNA}</p>
        <div className="cond-official-box">
          <p className="cond-sub">تُنعى ببالغ الحزن والأسى وفاة</p>
          <DeceasedName name={data.deceasedName} large />
        </div>
        <DetailsBlock data={data} />
        <p className="cond-footer-verse">تقبل الله منا ومنكم صالح الدعاء</p>
      </div>
    </>
  );
}

function TemplateBaqiyaLillah({ data }: { data: CondolenceFormData }) {
  return (
    <>
      <CircleOrnaments />
      <IslamicPatternBg />
      <div className="cond-inner cond-inner--baqiya">
        <CrescentSvg />
        <p className="cond-hero-text cond-hero-text--baqiya">البقاء لله</p>
        <DividerLine />
        <p className="cond-sub">انتقل إلى رحمة الله</p>
        <DeceasedName name={data.deceasedName} />
        <DetailsBlock data={data} />
      </div>
    </>
  );
}

function TemplateBashshirSabireen({ data }: { data: CondolenceFormData }) {
  return (
    <>
      <IslamicPatternBg />
      <svg className="cond-corner-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <CornerFrames color="rgba(255,255,255,0.2)" />
      </svg>
      <div className="cond-inner cond-inner--bashshir">
        <p className="cond-hero-text cond-hero-text--bashshir">وبشر الصابرين</p>
        <p className="cond-ayah">﴿ إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ ﴾</p>
        <DeceasedName name={data.deceasedName} />
        <DetailsBlock data={data} />
      </div>
    </>
  );
}

function renderTemplate(templateId: CondolenceTemplateId, data: CondolenceFormData, headline: string) {
  switch (templateId) {
    case "black_classic":
      return <TemplateBlackClassic data={data} headline={headline} />;
    case "circle_ornament":
      return <TemplateCircleOrnament data={data} headline={headline} />;
    case "large_arabic":
      return <TemplateLargeArabic data={data} headline={headline} />;
    case "official_death":
      return <TemplateOfficialDeath data={data} />;
    case "baqiya_lillah":
      return <TemplateBaqiyaLillah data={data} />;
    case "bashshir_sabireen":
      return <TemplateBashshirSabireen data={data} />;
    default:
      return <TemplateBlackClassic data={data} headline={headline} />;
  }
}

export function CondolencePreview({
  data,
  templateId,
  width,
  height,
  id = "condolence-export-card",
}: CondolencePreviewProps) {
  const headline = headlineForTemplate(templateId);

  return (
    <div
      id={id}
      dir="rtl"
      className={`cond-card cond-card--${templateId}`}
      style={{
        width,
        height,
        fontFamily: ARABIC_FONT,
      }}
    >
      {renderTemplate(templateId, data, headline)}
    </div>
  );
}
