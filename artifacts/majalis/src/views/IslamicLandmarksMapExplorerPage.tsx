/**
 * مستكشف الخريطة ملء الشاشة — الخريطة ليست العنصر الرئيسي في صفحة Discover.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import {
  ISLAMIC_LANDMARKS,
  LANDMARK_TYPES,
  type IslamicLandmark,
  type LandmarkType,
} from "@/lib/islamic-landmarks-data";
import { navigateTo } from "@/lib/navigation-intent";
import { ScreenTitle, SupportingText } from "@/components/design-system/text";
import "@/styles/islamic-landmarks.css";
import "leaflet/dist/leaflet.css";

const MapSection = lazy(() => import("@/components/landmarks/LandmarksMap"));

export default function IslamicLandmarksMapExplorerPage() {
  const [typeFilter, setTypeFilter] = useState<LandmarkType | "الكل">("الكل");

  useEffect(() => {
    applyPageSeo({
      path: "/islamic-landmarks/map",
      title: "مستكشف الخريطة — المشاهد الإسلامية | سُنّة",
      description: "خريطة تفاعلية لأبرز المشاهد الإسلامية والمساجد التاريخية حول العالم.",
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const landmarks = useMemo(
    () =>
      typeFilter === "الكل"
        ? ISLAMIC_LANDMARKS
        : ISLAMIC_LANDMARKS.filter((lm) => lm.type === typeFilter),
    [typeFilter],
  );

  const onSelect = (lm: IslamicLandmark) => {
    navigateTo(`/islamic-landmarks/${lm.id}`, { mode: "screen" });
  };

  return (
    <div className="ilm-explorer" dir="rtl" data-testid="ilm-map-explorer">
      <header className="ilm-explorer__bar">
        <Link href="/islamic-landmarks" className="ilm-explorer__close" aria-label="إغلاق المستكشف">
          <X size={18} strokeWidth={2} />
        </Link>
        <div className="ilm-explorer__titles">
          <ScreenTitle className="ilm-explorer__title">مستكشف الخريطة</ScreenTitle>
          <SupportingText className="ilm-explorer__sub">
            {landmarks.length} موقعًا — اضغط العلامة لفتح التفاصيل
          </SupportingText>
        </div>
        <Link href="/islamic-landmarks" className="ilm-explorer__back">
          <ArrowRight size={16} aria-hidden />
          العودة للاستكشاف
        </Link>
      </header>

      <div className="ilm-explorer__chips" role="tablist" aria-label="تصفية النوع على الخريطة">
        <button
          type="button"
          role="tab"
          aria-selected={typeFilter === "الكل"}
          className={`ilm-chip${typeFilter === "الكل" ? " ilm-chip--active" : ""}`}
          onClick={() => setTypeFilter("الكل")}
        >
          الكل
        </button>
        {LANDMARK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={typeFilter === type}
            className={`ilm-chip${typeFilter === type ? " ilm-chip--active" : ""}`}
            onClick={() => setTypeFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="ilm-explorer__map">
        <Suspense
          fallback={
            <p className="ilm-map-state" role="status">
              جاري تجهيز الخريطة…
            </p>
          }
        >
          <MapSection landmarks={landmarks} onSelect={onSelect} />
        </Suspense>
      </div>
    </div>
  );
}
