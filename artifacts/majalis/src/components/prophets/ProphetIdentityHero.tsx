/**
 * بطاقة هوية النبي — زمرد عميق + نص عاجي.
 * بيانات موجودة فقط؛ بلا زخارف كبيرة ولا فراغ ضخم.
 */
type Props = {
  arabicName: string;
  title: string;
  quranTitle?: string;
  orderLabel: string;
  isUlulAzm?: boolean;
  mentionCount?: number;
  mainSurah?: string;
  place?: string;
  pbuhText?: string;
};

export function ProphetIdentityHero({
  arabicName,
  title,
  quranTitle,
  orderLabel,
  isUlulAzm = false,
  mentionCount,
  mainSurah,
  place,
  pbuhText = "صلوات الله وسلامه عليه",
}: Props) {
  return (
    <header
      className="prophet-identity-hero"
      data-component="ProphetIdentityHero"
      data-testid="prophet-identity-hero"
    >
      <div className="prophet-identity-hero__content">
        <div className="prophet-identity-hero__meta">
          <span className="prophet-identity-hero__order">{orderLabel}</span>
          {isUlulAzm ? (
            <span className="prophet-identity-hero__azm">أولو العزم</span>
          ) : null}
        </div>
        <h1 className="prophet-identity-hero__name">{arabicName}</h1>
        <p className="prophet-identity-hero__pbuh">{pbuhText}</p>
        {title ? <p className="prophet-identity-hero__title">{title}</p> : null}
        {quranTitle ? (
          <p className="prophet-identity-hero__quran">﴿ {quranTitle} ﴾</p>
        ) : null}
        <ul className="prophet-identity-hero__chips" aria-label="ملخص سريع">
          {place ? (
            <li className="prophet-identity-hero__chip">
              <span className="prophet-identity-hero__chip-label">الموضع</span>
              <span className="prophet-identity-hero__chip-value">{place}</span>
            </li>
          ) : null}
          {mainSurah ? (
            <li className="prophet-identity-hero__chip">
              <span className="prophet-identity-hero__chip-label">أبرز سورة</span>
              <span className="prophet-identity-hero__chip-value">{mainSurah}</span>
            </li>
          ) : null}
          {mentionCount != null && mentionCount > 0 ? (
            <li className="prophet-identity-hero__chip">
              <span className="prophet-identity-hero__chip-label">مرات الذكر</span>
              <span className="prophet-identity-hero__chip-value">{mentionCount}</span>
            </li>
          ) : null}
        </ul>
      </div>
    </header>
  );
}
