/**
 * ميدالية آية ذهبية — خيار A: يحجز عرض مجسم QPC الأصلي (مخفي) ويعرض SVG فوقه.
 * خيار B: إن لم يُوفَّر glyph أو عرضه صفر، مجسم/ميدالية بعرض em ثابت.
 */
import { MushafAyahMarkerSvg } from "@/components/quran/MushafOrnaments";
import { toArabicDigits } from "@/lib/utils";

type Props = {
  ayahNumber: number;
  /** مجسم نهاية الآية من خط الصفحة — يحدد العرض الأفقي */
  glyphText?: string;
  /** true عند سقوط القياس → خيار B */
  fallback?: boolean;
};

export function AyahMarker({ ayahNumber, glyphText, fallback = false }: Props) {
  const num = toArabicDigits(ayahNumber);
  const useMeasured = Boolean(glyphText) && !fallback;

  if (useMeasured) {
    return (
      <span
        className="mf2-ayah-marker mf2-ayah-marker--medal mf2-ayah-marker--measured"
        data-ayah-marker="A"
        aria-label={`آية ${num}`}
      >
        <span className="mf2-ayah-marker__advance" aria-hidden="true">
          {glyphText}
        </span>
        <span className="mf2-ayah-marker__face" aria-hidden="true">
          <MushafAyahMarkerSvg className="mf2-ayah-marker__ring" />
          <span className="mf2-ayah-marker__num">{num}</span>
        </span>
      </span>
    );
  }

  /* خيار B: ميدالية بعرض em، أو تلوين المجسم إن وُجد */
  if (glyphText) {
    return (
      <span
        className="mf2-ayah-marker mf2-ayah-marker--medal mf2-ayah-marker--fallback-b"
        data-ayah-marker="B"
        aria-label={`آية ${num}`}
      >
        <span className="mf2-ayah-marker__advance mf2-ayah-marker__advance--gold" aria-hidden="true">
          {glyphText}
        </span>
      </span>
    );
  }

  return (
    <span
      className="mf2-ayah-marker mf2-ayah-marker--medal"
      data-ayah-marker="A"
      aria-label={`آية ${num}`}
    >
      <MushafAyahMarkerSvg className="mf2-ayah-marker__ring" />
      <span className="mf2-ayah-marker__num">{num}</span>
    </span>
  );
}
