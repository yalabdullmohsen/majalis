"use client";

import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";

export default function SheikhsPageClient({
  sheikhs,
}: {
  sheikhs: any[];
}) {
  return (
    <div className="page-shell ds-page">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {sheikhs.length === 0 ? (
        <Empty text="لا يوجد مشايخ بعد." />
      ) : (
        <>
          <p className="seo-listing-intro">
            {sheikhs.length.toLocaleString("ar-EG")} شيخ وعالم معتمد — اختر اسماً لعرض الملف العلمي والدروس المرتبطة.
          </p>
          <div className="page-card-grid">
            {sheikhs.map((sheikh) => (
              <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="page-card sheikh-card">
                <OptimizedSheikhImage
                  src={sheikh.photo_url || "/logo.png"}
                  name={sheikh.name}
                  className="sheikh-card-photo"
                />
                <div className="page-card-header">
                  <p>{sheikh.name}</p>
                  {sheikh.is_verified && <span className="page-tag">معتمد</span>}
                </div>
                {sheikh.ijazah && <p className="page-meta">{sheikh.ijazah}</p>}
                {sheikh.specialties?.length > 0 && (
                  <p className="page-desc">{sheikh.specialties.join("، ")}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
