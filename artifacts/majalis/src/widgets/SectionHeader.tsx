/** ترويسة قسم موحّدة — تُستبدل بالمكوّن الحي أثناء الترحيل. */
export function SectionHeader({
  titleAr,
  subtitleAr,
}: {
  titleAr: string;
  subtitleAr?: string;
}) {
  return (
    <header className="section-header">
      <h1 className="section-header__title">{titleAr}</h1>
      {subtitleAr ? <p className="section-header__sub">{subtitleAr}</p> : null}
    </header>
  );
}
