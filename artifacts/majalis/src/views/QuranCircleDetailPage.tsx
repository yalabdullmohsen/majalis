import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { getQuranCircleById } from "@/lib/quran-circles";

export default function QuranCircleDetailPage({ params }: { params: { id: string } }) {
  const circle = getQuranCircleById(params.id);

  if (!circle) {
    return (
      <div className="ds-page page-shell narrow">
        <Empty text="الحلقة غير موجودة." />
        <Link href="/quran-circles" className="ds-btn ds-btn--ghost">← العودة للحلقات</Link>
      </div>
    );
  }

  return (
    <div className="ds-page page-shell narrow">
      <PageHeader eyebrow="حلقة قرآن" title={circle.name} subtitle={circle.description} />

      <article className="detail-panel ui-card">
        <div className="detail-panel__hero">
          <img src={circle.image_url || "/logo.png"} alt="" width={120} height={120} />
          <div>
            <p><strong>الشيخ:</strong> {circle.sheikh_name}</p>
            <p><strong>المستوى:</strong> {circle.level}</p>
            <p><strong>المدينة:</strong> {circle.city}</p>
            {circle.mosque_name && <p><strong>المسجد:</strong> {circle.mosque_name}</p>}
          </div>
        </div>

        <dl className="detail-dl">
          <div><dt>الأيام</dt><dd>{circle.days}</dd></div>
          <div><dt>الوقت</dt><dd>{circle.time}</dd></div>
          <div><dt>الفئة العمرية</dt><dd>{circle.age_group}</dd></div>
          <div><dt>التسجيل</dt><dd>{circle.registration_method}</dd></div>
          {circle.seats_total != null && (
            <div><dt>المقاعد</dt><dd>{circle.seats_available} متاح من {circle.seats_total}</dd></div>
          )}
          {circle.start_date && (
            <div><dt>بداية الحلقة</dt><dd>{circle.start_date}</dd></div>
          )}
          {circle.end_date && (
            <div><dt>نهاية الحلقة</dt><dd>{circle.end_date}</dd></div>
          )}
        </dl>

        <div className="detail-tags">
          {circle.categories.map((c) => (
            <span key={c} className="page-tag">{c}</span>
          ))}
        </div>

        {circle.registration_url && (
          <a href={circle.registration_url} className="ds-btn ds-btn--primary">
            {circle.registration_url.startsWith("/") ? "طلب التسجيل" : "التسجيل"}
          </a>
        )}
      </article>

      <Link href="/quran-circles" className="ds-btn ds-btn--ghost">← كل الحلقات</Link>
    </div>
  );
}
