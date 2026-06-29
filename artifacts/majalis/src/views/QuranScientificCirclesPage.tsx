import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Calendar,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Users,
  Video,
} from "lucide-react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import {
  getQuranScientificCircles,
  getCircleFilterOptions,
} from "@/lib/quran-scientific-circles-service";
import {
  CIRCLE_TABS,
  CIRCLE_COUNTRIES,
  SORT_OPTIONS,
  REGISTRATION_LABELS,
  STATUS_LABELS,
  type CircleFilters,
  type QuranScientificCircle,
  type CircleTabGroup,
} from "@/lib/quran-scientific-circles-types";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function StatusBadge({ circle }: { circle: QuranScientificCircle }) {
  const reg = circle.registration_status;
  const cls =
    reg === "open"
      ? "qsc-badge qsc-badge--open"
      : reg === "closed"
        ? "qsc-badge qsc-badge--closed"
        : reg === "full"
          ? "qsc-badge qsc-badge--full"
          : "qsc-badge qsc-badge--soon";
  return (
    <span className={cls}>
      {reg ? REGISTRATION_LABELS[reg] : STATUS_LABELS[circle.status]}
    </span>
  );
}

function CircleCard({ circle }: { circle: QuranScientificCircle }) {
  const meta = [
    circle.circle_type,
    circle.country,
    circle.governorate,
    circle.days?.[0],
    circle.lesson_time,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/quran-scientific-circles/${circle.id}`} className="qsc-card-link">
      <article className={`qsc-card${circle.is_featured ? " qsc-card--featured" : ""}`}>
        {circle.is_pinned && <span className="qsc-card-pin">مثبّت</span>}
        <div className="qsc-card-head">
          <StatusBadge circle={circle} />
          {circle.data_incomplete && <span className="qsc-badge qsc-badge--incomplete">بيانات ناقصة</span>}
        </div>
        <h3 className="qsc-card-title">{circle.title}</h3>
        {circle.summary && <p className="qsc-card-summary">{circle.summary}</p>}
        <div className="qsc-card-meta">
          {circle.sheikh_name && (
            <span>
              <Users size={14} aria-hidden /> {circle.sheikh_name}
            </span>
          )}
          {(circle.venue_name || circle.region) && (
            <span>
              <MapPin size={14} aria-hidden /> {[circle.venue_name, circle.region].filter(Boolean).join(" — ")}
            </span>
          )}
          {circle.is_online && (
            <span>
              <Video size={14} aria-hidden /> عن بُعد
            </span>
          )}
          {circle.is_free && <span className="qsc-tag-free">مجاني</span>}
        </div>
        <p className="qsc-card-footer-meta">{meta}</p>
      </article>
    </Link>
  );
}

export default function QuranScientificCirclesPage() {
  const [items, setItems] = useState<QuranScientificCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CircleTabGroup | "all">("all");
  const [country, setCountry] = useState("الكل");
  const [governorate, setGovernorate] = useState("");
  const [sort, setSort] = useState<CircleFilters["sort"]>("nearest");
  const [womenOnly, setWomenOnly] = useState(false);
  const [childrenOnly, setChildrenOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const filterOptions = useMemo(() => getCircleFilterOptions(), []);

  usePageView("quran-scientific-circles", null);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-scientific-circles",
      title: "الحلقات القرآنية والعلمية | المجلس العلمي",
      description:
        "مرجع منظم لحلقات حفظ القرآن والمتون والدراسة الشرعية وفرص طلب العلم في الكويت والدول العربية.",
      keywords: [
        "حلقات قرآنية",
        "حفظ القرآن",
        "تجويد",
        "متون علمية",
        "دراسة شرعية",
        "الكويت",
        "طلب العلم",
      ],
      ogType: "website",
      canonicalPath: "/quran-scientific-circles",
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const delivery = onlineOnly ? "online" : offlineOnly ? "offline" : "all";
    getQuranScientificCircles({
      tab,
      search: debouncedSearch,
      country,
      governorate: governorate || undefined,
      sort,
      womenOnly,
      childrenOnly,
      freeOnly,
      delivery,
    })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [
    tab,
    debouncedSearch,
    country,
    governorate,
    sort,
    womenOnly,
    childrenOnly,
    onlineOnly,
    offlineOnly,
    freeOnly,
  ]);

  const tabIcon = (id: string) => {
    if (id === "quran") return BookOpen;
    if (id === "mutoon") return GraduationCap;
    if (id === "sharia") return BookOpen;
    return MapPin;
  };

  return (
    <div className="page-shell qsc-page">
      <PageHeader
        eyebrow="طلب العلم"
        title="الحلقات القرآنية والعلمية"
        subtitle="مرجع موحّد لحفظ القرآن والمتون والدراسة الشرعية وفرص طلب العلم — أين تدرس؟ متى تبدأ؟ من المشرف؟"
      />

      <div className="qsc-toolbar">
        <div className="qsc-search-wrap">
          <Search size={18} className="qsc-search-icon" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالعنوان، الشيخ، المنطقة، الجهة..."
            className="qsc-search-input"
            aria-label="بحث في الحلقات"
          />
        </div>
        <button
          type="button"
          className="qsc-filter-toggle"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <Filter size={16} aria-hidden /> فلاتر
        </button>
      </div>

      <div className="qsc-layout">
        <aside className={`qsc-filters${filtersOpen ? " qsc-filters--open" : ""}`}>
          <h2 className="qsc-filters-title">تصفية النتائج</h2>

          <label className="qsc-filter-field">
            <span>الدولة</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {CIRCLE_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="qsc-filter-field">
            <span>المحافظة</span>
            <select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
              <option value="">الكل</option>
              {filterOptions.governorates.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="qsc-filter-field">
            <span>الترتيب</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as CircleFilters["sort"])}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="qsc-filter-checks">
            <label>
              <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
              للنساء فقط
            </label>
            <label>
              <input type="checkbox" checked={childrenOnly} onChange={(e) => setChildrenOnly(e.target.checked)} />
              للأطفال فقط
            </label>
            <label>
              <input type="checkbox" checked={onlineOnly} onChange={(e) => { setOnlineOnly(e.target.checked); if (e.target.checked) setOfflineOnly(false); }} />
              عن بُعد فقط
            </label>
            <label>
              <input type="checkbox" checked={offlineOnly} onChange={(e) => { setOfflineOnly(e.target.checked); if (e.target.checked) setOnlineOnly(false); }} />
              حضوري فقط
            </label>
            <label>
              <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
              مجاني فقط
            </label>
          </div>
        </aside>

        <div className="qsc-main">
          <div className="qsc-tabs" role="tablist">
            {CIRCLE_TABS.map((t) => {
              const Icon = tabIcon(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? "qsc-tab qsc-tab--active" : "qsc-tab"}
                  onClick={() => setTab(t.id)}
                >
                  {t.id !== "all" && <Icon size={16} aria-hidden />}
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="qsc-stats-row">
            <span>{items.length} فرصة</span>
            <Link href="/calendar" className="page-link-inline">
              <Calendar size={14} aria-hidden /> التقويم
            </Link>
          </div>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <Empty text="لا توجد حلقات مطابقة للبحث." />
          ) : (
            <div className="qsc-grid">
              {items.map((item) => (
                <CircleCard key={item.id} circle={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
