"use client";

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";
import { arabicMatchAny } from "@/lib/arabic-search";
import type { ScholarProfile } from "@/lib/scholar-biography";
import { extractBiographySearchTerms } from "@/lib/scholar-biography";

export default function SheikhsPageClient({
  sheikhs,
}: {
  sheikhs: ScholarProfile[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return sheikhs;
    return sheikhs.filter((sheikh) =>
      arabicMatchAny(
        [
          sheikh.name,
          sheikh.fullName,
          sheikh.kunya,
          sheikh.title,
          sheikh.ijazah,
          sheikh.city,
          sheikh.country,
          sheikh.bio,
          sheikh.biography,
          ...(sheikh.specialties || []),
          ...(sheikh.mutoon || []),
          ...(sheikh.subjects || []),
          ...(sheikh.qualifications || []),
          ...extractBiographySearchTerms(sheikh.biography_data || {}),
        ],
        q,
      ),
    );
  }, [sheikhs, query]);

  return (
    <div className="page-shell ds-page">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      <div className="sheikhs-search-bar">
        <input
          type="search"
          className="ds-input sheikhs-search-input"
          placeholder="بحث بالاسم، الكنية، اللقب، الدولة، المدينة، التخصص، المؤلفات..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="بحث في المشايخ"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty text={query ? "لا توجد نتائج مطابقة." : "لا يوجد مشايخ بعد."} />
      ) : (
        <>
          <p className="seo-listing-intro">
            {filtered.length.toLocaleString("ar-EG")} شيخ وعالم
            {query ? " — نتائج البحث" : " معتمد — اختر اسماً لعرض الملف العلمي والدروس المرتبطة."}
          </p>
          <div className="page-card-grid">
            {filtered.map((sheikh) => (
              <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="page-card sheikh-card">
                <OptimizedSheikhImage
                  src={sheikh.photo_url || sheikh.image_url || "/logo.png"}
                  name={sheikh.name}
                  className="sheikh-card-photo"
                />
                <div className="page-card-header">
                  <p>{sheikh.fullName || sheikh.name}</p>
                  {sheikh.is_verified && <span className="page-tag">معتمد</span>}
                </div>
                {(sheikh.kunya || sheikh.title || sheikh.ijazah) && (
                  <p className="page-meta">{[sheikh.kunya, sheikh.title || sheikh.ijazah].filter(Boolean).join(" · ")}</p>
                )}
                {(sheikh.country || sheikh.city) && (
                  <p className="page-meta">{[sheikh.country, sheikh.city].filter(Boolean).join(" · ")}</p>
                )}
                {(sheikh.specialties?.length ?? 0) > 0 && (
                  <p className="page-desc">{(sheikh.specialties ?? []).join("، ")}</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
