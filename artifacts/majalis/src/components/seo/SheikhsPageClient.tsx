"use client";

import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";

import { T } from "@/lib/terminology";

export default function SheikhsPageClient({
  sheikhs,
}: {
  sheikhs: any[];
}) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title={T.sheikhs}
        subtitle="تعرّف على المشايخ المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {sheikhs.length === 0 ? (
        <Empty text="لا يوجد مشايخ بعد." />
      ) : (
        <>
          <p className="seo-listing-intro">
            {sheikhs.length.toLocaleString("ar-EG")} شيخ وعالم معتمد — اختر اسماً لعرض السيرة والدروس المرتبطة.
          </p>
          <div className="page-card-grid">
            {sheikhs.map((sheikh) => (
              <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="page-card">
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
