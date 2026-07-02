import { useEffect, useMemo, useRef, useState } from "react";
import { getVerifiedHadith } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { arabicMatchAny } from "@/lib/arabic-search";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { useAuth } from "@/components/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type HadithItem = {
  id: string;
  title: string | null;
  text: string;
  narrator: string | null;
  source_name: string | null;
  grade: string | null;
  collection: string | null;
  chapter: string | null;
  explanation: string | null;
  keywords: string[] | null;
  hadith_number: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const COLLECTION_LABELS: Record<string, string> = {
  mutafaq:  "متفق عليه",
  nawawi40: "الأربعون النووية",
  bukhari:  "صحيح البخاري",
  muslim:   "صحيح مسلم",
  tirmidhi: "سنن الترمذي",
  abudawud: "سنن أبي داود",
  nasai:    "سنن النسائي",
  ibnmajah: "سنن ابن ماجه",
  muwatta:  "موطأ مالك",
  riyadh:   "رياض الصالحين",
  jawami:   "صحيح الجامع",
  silsila:  "السلسلة الصحيحة",
};

const COLLECTION_ORDER: Record<string, number> = {
  mutafaq: 0, bukhari: 1, muslim: 2, nawawi40: 3,
  tirmidhi: 4, abudawud: 5, nasai: 6, ibnmajah: 7,
  muwatta: 8, riyadh: 9, jawami: 10, silsila: 11,
};

function collectionLabel(key: string | null): string {
  if (!key) return "";
  return COLLECTION_LABELS[key] ?? key;
}

function collectionBadgeClass(key: string | null): string {
  if (!key) return "hadith-badge--collection";
  const map: Record<string, string> = {
    mutafaq:  "hadith-badge--mutafaq",
    bukhari:  "hadith-badge--bukhari",
    muslim:   "hadith-badge--muslim",
    nawawi40: "hadith-badge--nawawi",
    tirmidhi: "hadith-badge--tirmidhi",
    abudawud: "hadith-badge--abudawud",
    nasai:    "hadith-badge--nasai",
    ibnmajah: "hadith-badge--ibnmajah",
  };
  return map[key] ?? "hadith-badge--collection";
}

const GRADE_CLASS: Record<string, string> = {
  صحيح: "hadith-grade--sahih",
  "حسن صحيح": "hadith-grade--hasan-sahih",
  حسن: "hadith-grade--hasan",
  ضعيف: "hadith-grade--daif",
};

function gradeClass(grade: string | null): string {
  if (!grade) return "hadith-grade--sahih";
  return GRADE_CLASS[grade.trim()] ?? "hadith-grade--sahih";
}

// ─── HadithCard ──────────────────────────────────────────────────────────────

function HadithCard({ h, onExpand }: { h: HadithItem; onExpand: (h: HadithItem) => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const content = `${h.text}\n\n— ${h.narrator ?? ""} | ${h.source_name ?? ""}`;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaved((s) => !s);
  }

  const compRef = h.metadata?.companion as string | undefined;

  return (
    <article
      className="hadith-card ui-card"
      onClick={() => onExpand(h)}
      onKeyDown={(e) => e.key === "Enter" && onExpand(h)}
      tabIndex={0}
      role="button"
      aria-label={`عرض تفاصيل الحديث: ${h.title ?? ""}`}
    >
      {/* Header */}
      <header className="hadith-card__header">
        <div className="hadith-card__badges">
          {h.collection && (
            <span className={`hadith-badge ${collectionBadgeClass(h.collection)}`}>
              {collectionLabel(h.collection)}
            </span>
          )}
          {h.hadith_number && (
            <span className="hadith-badge hadith-badge--num">#{h.hadith_number}</span>
          )}
        </div>
        {h.grade && (
          <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
        )}
      </header>

      {/* Title */}
      {h.title && h.title !== "حديث" && (
        <h3 className="hadith-card__title">{h.title}</h3>
      )}
      {h.chapter && (
        <p className="hadith-card__chapter">{h.chapter}</p>
      )}

      {/* Text */}
      <blockquote className="hadith-card__text">{h.text}</blockquote>

      {/* Meta */}
      <div className="hadith-card__meta">
        {(h.narrator || compRef) && (
          <span className="hadith-meta-item">
            <span className="hadith-meta-label">الراوي:</span>{" "}
            {h.narrator ?? compRef}
          </span>
        )}
        {h.source_name && (
          <span className="hadith-meta-item">
            <span className="hadith-meta-label">المصدر:</span>{" "}
            {h.source_name}
          </span>
        )}
      </div>

      {/* Keywords */}
      {h.keywords && h.keywords.length > 0 && (
        <div className="hadith-card__keywords">
          {h.keywords.slice(0, 4).map((k) => (
            <span key={k} className="hadith-keyword">{k}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="hadith-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`hadith-action-btn ${saved ? "hadith-action-btn--active" : ""}`}
          title={saved ? "محفوظ" : "حفظ في المفضلة"}
          onClick={handleSave}
          aria-label="حفظ في المفضلة"
        >
          {saved ? "★" : "☆"}
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          title="نسخ"
          onClick={handleCopy}
          aria-label="نسخ الحديث"
        >
          {copied ? "✓" : "⎘"}
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          title="عرض التفاصيل"
          onClick={(e) => { e.stopPropagation(); onExpand(h); }}
          aria-label="عرض التفاصيل"
        >
          ↗
        </button>
      </div>
    </article>
  );
}

// ─── HadithDetailModal ────────────────────────────────────────────────────────

function HadithDetailModal({ h, onClose }: { h: HadithItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleCopy() {
    const content = `${h.title ? h.title + "\n" : ""}${h.text}\n\n— ${h.narrator ?? ""} | ${h.source_name ?? ""}`;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const meta = h.metadata ?? {};

  return (
    <div
      className="hadith-modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="تفاصيل الحديث"
    >
      <div className="hadith-modal">
        <div className="hadith-modal__head">
          <div className="hadith-modal__badges">
            {h.collection && (
              <span className="hadith-badge hadith-badge--collection">
                {collectionLabel(h.collection)}
              </span>
            )}
            {h.hadith_number && (
              <span className="hadith-badge hadith-badge--num">حديث #{h.hadith_number}</span>
            )}
            {h.grade && (
              <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
            )}
          </div>
          <button
            type="button"
            className="hadith-modal__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {h.title && h.title !== "حديث" && (
          <h2 className="hadith-modal__title">{h.title}</h2>
        )}
        {h.chapter && <p className="hadith-modal__chapter">{h.chapter}</p>}

        <blockquote className="hadith-modal__text">{h.text}</blockquote>

        <div className="hadith-modal__meta-grid">
          {(h.narrator || meta.companion) && (
            <div className="hadith-modal__meta-item">
              <strong>الراوي</strong>
              <span>{h.narrator ?? String(meta.companion ?? "")}</span>
            </div>
          )}
          {meta.companion && h.narrator !== meta.companion && (
            <div className="hadith-modal__meta-item">
              <strong>الصحابي</strong>
              <span>{String(meta.companion)}</span>
            </div>
          )}
          {h.source_name && (
            <div className="hadith-modal__meta-item">
              <strong>المصدر</strong>
              <span>{h.source_name}</span>
            </div>
          )}
          {meta.takhrij && (
            <div className="hadith-modal__meta-item">
              <strong>التخريج</strong>
              <span>{String(meta.takhrij)}</span>
            </div>
          )}
          {h.grade && (
            <div className="hadith-modal__meta-item">
              <strong>درجة الحديث</strong>
              <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
            </div>
          )}
          {h.chapter && (
            <div className="hadith-modal__meta-item">
              <strong>الباب</strong>
              <span>{h.chapter}</span>
            </div>
          )}
        </div>

        {h.explanation && (
          <section className="hadith-modal__explanation">
            <h3>الشرح والفائدة</h3>
            <p>{h.explanation}</p>
          </section>
        )}

        {h.keywords && h.keywords.length > 0 && (
          <div className="hadith-modal__keywords">
            <strong>الكلمات المفتاحية:</strong>
            <div className="hadith-keywords-row">
              {h.keywords.map((k) => (
                <span key={k} className="hadith-keyword">{k}</span>
              ))}
            </div>
          </div>
        )}

        <div className="hadith-modal__actions">
          <button
            type="button"
            className="hadith-modal-btn"
            onClick={handleCopy}
          >
            {copied ? "✓ تم النسخ" : "⎘ نسخ الحديث"}
          </button>
          {typeof navigator.share === "function" && (
            <button
              type="button"
              className="hadith-modal-btn"
              onClick={() =>
                navigator.share({
                  title: h.title ?? "حديث شريف",
                  text: `${h.text}\n\n— ${h.source_name ?? ""}`,
                })
              }
            >
              ↑ مشاركة
            </button>
          )}
        </div>

        <footer className="hadith-modal__footer">
          <p>⚠️ تحقق من صحة الحديث ومصدره قبل النشر أو الاستشهاد به.</p>
        </footer>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "الكل", label: "الكل" },
  { id: "العقيدة والإيمان", label: "العقيدة والإيمان", keys: ["إيمان","توحيد","عقيدة","قدر","توكل"] },
  { id: "العبادات", label: "العبادات", keys: ["صلاة","زكاة","صوم","حج","طهارة","تلاوة","قرآن"] },
  { id: "الأخلاق", label: "الأخلاق", keys: ["أخلاق","خلق","حياء","غضب","صبر","رحمة","إحسان"] },
  { id: "الزهد والرقائق", label: "الزهد والرقائق", keys: ["زهد","دنيا","آخرة","رقائق","توبة"] },
  { id: "العلم", label: "العلم", keys: ["علم","طلب العلم","قرآن","سنة"] },
  { id: "المعاملات", label: "المعاملات", keys: ["حلال","حرام","بينة","ضرر","قضاء"] },
  { id: "الأخوة والاجتماع", label: "الأخوة", keys: ["أخوة","مسلم","اجتماع","هجران","وحدة"] },
];

export default function HadithPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<HadithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [activeCollection, setActiveCollection] = useState("الكل");
  const [expandedHadith, setExpandedHadith] = useState<HadithItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    RequestManager.run("hadith:list", () => getVerifiedHadith({ limit: 500 }))
      .then(({ data }) => setItems((data as HadithItem[]) ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const collections = useMemo(() => {
    const set = new Set<string>();
    items.forEach((h) => { if (h.collection) set.add(h.collection); });
    const sorted = Array.from(set).sort(
      (a, b) => (COLLECTION_ORDER[a] ?? 99) - (COLLECTION_ORDER[b] ?? 99)
    );
    return ["الكل", ...sorted];
  }, [items]);

  const displayItems = useMemo(() => {
    let list = items;
    if (activeCollection !== "الكل") {
      list = list.filter((h) => h.collection === activeCollection);
    }
    if (activeCategory !== "الكل") {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat?.keys) {
        list = list.filter((h) =>
          cat.keys!.some((k) =>
            h.keywords?.includes(k) ||
            h.chapter?.includes(k) ||
            h.title?.includes(k)
          )
        );
      }
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim();
      list = list.filter((h) =>
        arabicMatchAny([h.text, h.title, h.narrator, h.source_name, h.explanation, h.chapter, ...(h.keywords ?? [])], q)
      );
    }
    return list;
  }, [items, activeCollection, activeCategory, debouncedSearch]);

  const filtersPanel = (
    <div className="hadith-filters-panel">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأحاديث..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأحاديث"
      />

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">المجموعة</p>
        <div className="content-hub-chips">
          {collections.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCollection(c)}
              className={activeCollection === c ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {c === "الكل" ? "الكل" : collectionLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">الموضوع</p>
        <div className="content-hub-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell content-hub-page ds-page hadith-page">
      <PageHeader
        eyebrow="السنة النبوية الشريفة"
        title="الأحاديث الصحيحة"
        subtitle="أحاديث نبوية مختارة من مصادر موثوقة ومحققة — الأربعون النووية وغيرها."
      />

      <div className="ds-section__head">
        <div className="hadith-stats-row">
          {isAdmin && (
            <>
              <span className="hadith-stat">
                <strong>{displayItems.length}</strong> حديث
              </span>
              <span className="hadith-stat">
                <strong>{collections.length - 1}</strong> مجموعة
              </span>
            </>
          )}
          {debouncedSearch && (
            <button
              type="button"
              className="hadith-clear-search"
              onClick={() => setSearch("")}
            >
              مسح البحث ✕
            </button>
          )}
        </div>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {/* Category chips (quick filter on desktop) */}
      <div className="hadith-quick-cats">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`hadith-quick-cat ${activeCategory === cat.id ? "hadith-quick-cat--active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : displayItems.length === 0 ? (
        <Empty
          text={
            debouncedSearch.trim()
              ? `لا توجد أحاديث مطابقة لـ «${debouncedSearch.trim()}».`
              : "لا توجد أحاديث في هذا التصنيف."
          }
        />
      ) : (
        <div className="hadith-grid">
          {displayItems.map((h) => (
            <HadithCard key={h.id} h={h} onExpand={setExpandedHadith} />
          ))}
        </div>
      )}

      {/* Desktop sidebar filters */}
      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head">
          <h2>بحث وتصفية</h2>
        </div>
        {filtersPanel}
      </aside>

      {/* Mobile filter sheet */}
      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>

      {/* Detail modal */}
      {expandedHadith && (
        <HadithDetailModal
          h={expandedHadith}
          onClose={() => setExpandedHadith(null)}
        />
      )}
    </div>
  );
}
