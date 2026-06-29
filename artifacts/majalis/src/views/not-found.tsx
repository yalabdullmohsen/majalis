import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="not-found-page--v2026">
      <section className="not-found-card--v2026">
        <p className="not-found-card--v2026__code" aria-hidden="true">
          404
        </p>
        <h1>الصفحة غير موجودة</h1>
        <p>
          يبدو أن الرابط غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى الرئيسية أو استخدام البحث
          للوصول إلى الدروس والفوائد والكتب.
        </p>
        <div className="not-found-actions--v2026">
          <Link href="/" className="home-hero__cta home-hero__cta--primary">
            العودة للرئيسية
          </Link>
          <Link href="/scholar-search" className="home-hero__cta home-hero__cta--ghost">
            الباحث العلمي
          </Link>
          <Link href="/lessons" className="home-hero__cta home-hero__cta--ghost">
            الدروس
          </Link>
        </div>
      </section>
    </div>
  );
}
