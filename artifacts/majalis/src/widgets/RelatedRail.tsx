/**
 * شريط «ذو صلة» — يُفعَّل من الرسم البياني في حزمة H.
 * Stub بلا بيانات في B/C حتى وجود links.json.
 */
export type RelatedRailItem = {
  titleAr: string;
  href: string;
  groupAr?: string;
};

export function RelatedRail({
  titleAr = "ذو صلة",
  items = [],
}: {
  titleAr?: string;
  items?: readonly RelatedRailItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="related-rail" aria-label={titleAr}>
      <h2 className="related-rail__title">{titleAr}</h2>
      <ul className="related-rail__list">
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.titleAr}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
