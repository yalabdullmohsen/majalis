import "@/styles/islamic-landmarks.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { applyPageSeo } from "@/lib/seo";
import {
  ISLAMIC_LANDMARKS,
  LANDMARK_COUNTRIES,
  LANDMARK_ERAS,
  LANDMARK_TYPES,
  type IslamicLandmark,
} from "@/lib/islamic-landmarks-data";
import { MapPin, LayoutGrid, List, X, ExternalLink, Maximize2 } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import { UtilityScreen } from "@/components/design-system/screens";
import { DirectoryMedia } from "@/components/directory/DirectoryMedia";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import "@/styles/components/directory-media.css";

// Leaflet — تحميل كسول لتجنب مشاكل SSR
const MapSection = lazy(() => import("@/components/landmarks/LandmarksMap"));

/* ═══════════════════════════════════════════════════
   بطاقة موقع واحد
═══════════════════════════════════════════════════ */
function LandmarkCard({
  landmark,
  listView,
  onClick,
}: {
  landmark: IslamicLandmark;
  listView: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`ilm-card soft-card soft-card--on-light mj-pressable${listView ? " ilm-card--list" : ""}`}
      onClick={onClick}
      aria-label={`فتح تفاصيل ${landmark.name}`}
    >
      <div className="ilm-card__img">
        <DirectoryMedia
          src={landmark.imageUrl}
          alt=""
          fallbackLabel={landmark.city}
          ratio="16 / 10"
        />
      </div>

      <div className="ilm-card__body">
        <div className="ilm-card__head">
          <h3 className="ilm-card__name">{landmark.name}</h3>
          <div className="ilm-card__badges">
            <span className="ilm-badge ilm-badge--type">{landmark.type}</span>
          </div>
        </div>

        <div className="ilm-card__location">
          <MapPin size={12} strokeWidth={2} />
          {landmark.city}، {landmark.country}
        </div>

        <span className="ilm-badge ilm-badge--era">{landmark.era}</span>

        <p className="ilm-card__desc">{landmark.description}</p>

        {landmark.builtYear ? (
          <p className="ilm-card__meta">تأسيس / بناء: {landmark.builtYear}</p>
        ) : null}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   نافذة التفاصيل
═══════════════════════════════════════════════════ */
function LandmarkModal({
  landmark,
  onClose,
}: {
  landmark: IslamicLandmark;
  onClose: () => void;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${landmark.lat},${landmark.lng}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) — مسار بديل كامل
    // بلوحة المفاتيح (بالإضافة لزر إغلاق ظاهر داخل النافذة إن وُجد).
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="ilm-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal
      aria-label={landmark.name}
    >
      <div className="ilm-modal-inner">
        <div className="ilm-modal">
          <div className="ilm-modal__img">
            <MapPin size={64} />
          </div>
          <button
            type="button"
            className="ilm-modal__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>

          <div className="ilm-modal__body">
            <h2 className="ilm-modal__title">{landmark.name}</h2>
            <div className="ilm-modal__city">
              <MapPin size={14} />
              {landmark.city}، {landmark.country}
            </div>

            <div className="ilm-card__badges" style={{ marginBottom: "0.75rem" }}>
              <span className="ilm-badge ilm-badge--type">{landmark.type}</span>
              <span className="ilm-badge ilm-badge--era">{landmark.era}</span>
            </div>

            {landmark.builtYear && (
              <>
                <p className="ilm-modal__section-title">تاريخ البناء</p>
                <p className="ilm-modal__text">{landmark.builtYear}</p>
              </>
            )}

            <p className="ilm-modal__section-title">وصف الموقع</p>
            <p className="ilm-modal__text">{landmark.description}</p>

            <p className="ilm-modal__section-title">الأهمية الإسلامية</p>
            <p className="ilm-modal__text">{landmark.significance}</p>

            {(landmark.capacity || landmark.area) && (
              <div className="ilm-modal__meta">
                {landmark.capacity && (
                  <div className="ilm-modal__meta-item">
                    <div className="ilm-modal__meta-label">الطاقة الاستيعابية</div>
                    <div className="ilm-modal__meta-val">{landmark.capacity}</div>
                  </div>
                )}
                {landmark.area && (
                  <div className="ilm-modal__meta-item">
                    <div className="ilm-modal__meta-label">المساحة</div>
                    <div className="ilm-modal__meta-val">{landmark.area}</div>
                  </div>
                )}
              </div>
            )}

            {landmark.tags.length > 0 && (
              <>
                <p className="ilm-modal__section-title">الكلمات المفتاحية</p>
                <div className="ilm-card__tags">
                  {landmark.tags.map((tag) => (
                    <span key={tag} className="ilm-tag">{tag}</span>
                  ))}
                </div>
              </>
            )}

            <a
              href={mapsUrl}
              target="_blank" rel="noopener noreferrer"
              className="ilm-map-btn"
            >
              <Maximize2 size={15} />
              عرض على الخريطة
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   الصفحة الرئيسية
═══════════════════════════════════════════════════ */
export default function IslamicLandmarksPage() {
  const [activeCountry, setActiveCountry] = useState<string>("الكل");
  const [activeEra, setActiveEra] = useState<string>("الكل");
  const [activeType, setActiveType] = useState<string>("الكل");
  const [search, setSearch] = useState("");
  const [listView, setListView] = useState(false);
  const [selected, setSelected] = useState<IslamicLandmark | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/islamic-landmarks",
      title: "المشاهد الإسلامية والمساجد التاريخية | سُنّة",
      description:
        "استكشف أبرز المشاهد الإسلامية والمساجد التاريخية حول العالم: المسجد الحرام، المسجد النبوي، المسجد الأقصى، الجامع الأزهر، وأكثر من أربعين موقعًا",
      keywords: [
        "مساجد إسلامية",
        "مشاهد إسلامية",
        "المسجد الحرام",
        "المسجد الأقصى",
        "المسجد النبوي",
        "الجامع الأزهر",
        "مساجد العالم",
        "التراث الإسلامي",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "المشاهد الإسلامية والمساجد التاريخية",
          url: "https://www.ssunnah.com/islamic-landmarks",
          description:
            "مجموعة أبرز المشاهد الإسلامية والمساجد التاريخية حول العالم مع معلومات تاريخية مفصلة. محتوى معتمد في منهج سُنّة",
        },
      ],
    });
  }, []);

  const filtered = useMemo(() => {
    return ISLAMIC_LANDMARKS.filter((lm) => {
      if (activeCountry !== "الكل" && lm.country !== activeCountry) return false;
      if (activeEra !== "الكل" && lm.era !== activeEra) return false;
      if (activeType !== "الكل" && lm.type !== activeType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          lm.name.includes(q) ||
          lm.city.includes(q) ||
          lm.country.includes(q) ||
          lm.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [activeCountry, activeEra, activeType, search]);

  return (
    <UtilityScreen compose="mark">
    <div className="ilm-page">
      {/* Hero */}
      <div className="ilm-hero ilm-hero--compact">
        <div className="ilm-hero__icon" aria-hidden>
          <MapPin size={28} />
        </div>
        <h1 className="ilm-hero__title">المشاهد الإسلامية والمساجد التاريخية</h1>
        <p className="ilm-hero__sub">
          استكشف أبرز المساجد والمشاهد الإسلامية التاريخية حول العالم، وتعرّف
          على تاريخها وأهميتها الإسلامية
        </p>
        <div className="ilm-hero__stats">
          <div className="ilm-hero__stat">
            <span className="ilm-hero__stat-num">{ISLAMIC_LANDMARKS.length}+</span>
            <span className="ilm-hero__stat-lbl">موقع إسلامي</span>
          </div>
          <div className="ilm-hero__stat">
            <span className="ilm-hero__stat-num">
              {new Set(ISLAMIC_LANDMARKS.map((l) => l.country)).size}
            </span>
            <span className="ilm-hero__stat-lbl">دولة</span>
          </div>
          <div className="ilm-hero__stat">
            <span className="ilm-hero__stat-num">
              {new Set(ISLAMIC_LANDMARKS.map((l) => l.era)).size}
            </span>
            <span className="ilm-hero__stat-lbl">حقبة تاريخية</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="ilm-controls ilm-controls--compact">
        <p className="ilm-count" aria-live="polite">
          {filtered.length === ISLAMIC_LANDMARKS.length
            ? `${filtered.length} موقعًا`
            : `${filtered.length} من أصل ${ISLAMIC_LANDMARKS.length}`}
        </p>

        <input
          type="search"
          className="ilm-search"
          placeholder="ابحث عن مسجد أو مدينة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="البحث في المشاهد الإسلامية"
        />

        <div className="ilm-toolbar">
          <FilterToggle
            expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
            label={
              activeCountry !== "الكل" || activeEra !== "الكل" || activeType !== "الكل"
                ? `تصفية (${[activeCountry !== "الكل", activeEra !== "الكل", activeType !== "الكل"].filter(Boolean).length})`
                : "تصفية"
            }
          />
          {activeCountry !== "الكل" && (
            <span className="ilm-active-chip">{activeCountry}</span>
          )}
          <div className="ilm-view-toggle">
            <button
              type="button"
              className={`ilm-view-btn${!listView ? " ilm-view-btn--active" : ""}`}
              onClick={() => setListView(false)}
              aria-label="عرض شبكي"
              title="عرض شبكي"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`ilm-view-btn${listView ? " ilm-view-btn--active" : ""}`}
              onClick={() => setListView(true)}
              aria-label="عرض قائمة"
              title="عرض قائمة"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`ilm-view-btn${showMap ? " ilm-view-btn--active" : ""}`}
              onClick={() => setShowMap((s) => !s)}
              aria-label="تبديل الخريطة"
              title="إظهار/إخفاء الخريطة"
            >
              <MapPin size={16} />
            </button>
          </div>
        </div>

        {(activeCountry !== "الكل" || activeEra !== "الكل" || activeType !== "الكل") && (
          <div className="ilm-filter-summary">
            <span>
              {[
                activeCountry !== "الكل" ? activeCountry : null,
                activeEra !== "الكل" ? activeEra : null,
                activeType !== "الكل" ? activeType : null,
              ].filter(Boolean).join(" · ")}
            </span>
            <button
              type="button"
              className="ilm-clear-filters"
              onClick={() => {
                setActiveCountry("الكل");
                setActiveEra("الكل");
                setActiveType("الكل");
              }}
            >
              مسح التصفية
            </button>
          </div>
        )}
      </div>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية المشاهد">
        <div className="ilm-sheet-filters">
          <label className="ilm-sheet-field">
            <span>الدولة</span>
            <select
              className="ilm-select"
              value={activeCountry}
              onChange={(e) => setActiveCountry(e.target.value)}
            >
              {LANDMARK_COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </label>
          <label className="ilm-sheet-field">
            <span>الحقبة</span>
            <select
              className="ilm-select"
              value={activeEra}
              onChange={(e) => setActiveEra(e.target.value)}
              aria-label="فلترة حسب الحقبة"
            >
              <option value="الكل">كل الحقب</option>
              {LANDMARK_ERAS.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
          </label>
          <label className="ilm-sheet-field">
            <span>النوع</span>
            <select
              className="ilm-select"
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              aria-label="فلترة حسب النوع"
            >
              <option value="الكل">كل الأنواع</option>
              {LANDMARK_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <button type="button" className="ilm-sheet-apply" onClick={() => setFiltersOpen(false)}>
            عرض النتائج ({filtered.length})
          </button>
        </div>
      </FilterBottomSheet>

      {/* Interactive Map */}
      {showMap && (
        <div className="ilm-map-wrap">
          <Suspense fallback={
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mj-muted)" }}>
              تحديث الخريطة…
            </div>
          }>
            <MapSection
              landmarks={filtered}
              onSelect={setSelected}
            />
          </Suspense>
        </div>
      )}

      {/* Grid */}
      <div className="ilm-body">
        <p className="ilm-count">
          {filtered.length === ISLAMIC_LANDMARKS.length
            ? `${filtered.length} موقعًا إسلاميًا`
            : `${filtered.length} من أصل ${ISLAMIC_LANDMARKS.length} موقعًا`}
        </p>

        <div className={`ilm-grid${listView ? " ilm-grid--list" : ""}`}>
          {filtered.length === 0 ? (
            <p className="ilm-empty">لا توجد مواقع تطابق معايير البحث</p>
          ) : (
            filtered.map((lm) => (
              <LandmarkCard
                key={lm.id}
                landmark={lm}
                listView={listView}
                onClick={() => setSelected(lm)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <LandmarkModal
          landmark={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="ilm-share-wrap">
        <ShareButtons title="المواقع الإسلامية التاريخية | سُنّة" url="https://www.ssunnah.com/islamic-landmarks" />
      </div>
    </div>
    </UtilityScreen>
  );
}
