export function ListingPageSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="جاري التحميل">
      <div className="seo-skeleton seo-skeleton--header" />
      <div className="seo-skeleton seo-skeleton--search" />
      <div className="seo-skeleton-row">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="seo-skeleton seo-skeleton--chip" />
        ))}
      </div>
      <div className="seo-skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="seo-skeleton seo-skeleton--card" />
        ))}
      </div>
    </div>
  );
}
