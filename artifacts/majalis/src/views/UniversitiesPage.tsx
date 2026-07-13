import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, GraduationCap, Landmark, Search } from "lucide-react";
import { CompareProvider } from "@/components/universities/CompareContext";
import { CompareBar } from "@/components/universities/CompareBar";
import { UniversityCard } from "@/components/universities/UniversityCard";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  fetchUniversities,
  DEGREE_LEVELS,
  STUDY_MODES,
  LANGUAGES,
  type University,
  type UniversityFilters,
} from "@/lib/universities-service";

const COUNTRIES = [
  "المملكة العربية السعودية", "مصر", "الأردن", "قطر",
  "ماليزيا", "السودان", "إندونيسيا", "المغرب", "الإمارات", "الكويت",
];

function FilterSelect({
  label, value, onChange, options, placeholder = "الكل",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="up-filter-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="up-filter-select"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function UniversitiesContent() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading]           = useState(true);
  const [, setTotal]                     = useState(0);
  const [seedNeeded, setSeedNeeded]     = useState(false);
  const [search, setSearch]             = useState("");
  const [searchInput, setSearchInput]   = useState("");
  const [filters, setFilters]           = useState<UniversityFilters>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUniversities({ ...filters, search: search || undefined });
      setUniversities(res.items);
      setTotal(res.total);
      setSeedNeeded(!!res.seed_needed);
    } catch (err) {
      console.error("فشل تحميل الجامعات:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    applyPageSeo({
      path: "/universities",
      title: "دليل الجامعات الإسلامية | المجلس العلمي",
      description: "دليل شامل للجامعات والمعاهد الإسلامية حول العالم، ابحث وقارن بين الجامعات حسب التخصص والمستوى وطريقة الدراسة.",
      keywords: ["جامعات إسلامية", "كليات شريعة", "دراسة شرعية", "جامعة إسلامية", "معهد ديني"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "دليل الجامعات الإسلامية حول العالم",
          description: "جامعات ومعاهد إسلامية في عشرات الدول العربية والإسلامية",
          numberOfItems: COUNTRIES.length,
          itemListElement: COUNTRIES.map((country, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `الجامعات الإسلامية في ${country}`,
            url: `https://majlisilm.com/universities?country=${encodeURIComponent(country)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  function setFilter(key: keyof UniversityFilters, value: string | boolean | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div dir="rtl" className="up-root">
      {/* Header */}
      <div className="text-white py-10 px-4 ldb-hero">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <GraduationCap size={22} strokeWidth={1.5} aria-hidden="true" />
            دليل الجامعات والكليات الشرعية
          </h1>
          <p className="text-white/85 text-sm max-w-xl mx-auto leading-relaxed">
            موسوعة شاملة للجامعات التي تُقدّم دراسات شرعية حول العالم.
            ابحث وقارن وصل لرابط التقديم الرسمي مباشرة.
          </p>

          {/* بحث */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث عن جامعة أو تخصص…"
              aria-label="بحث عن جامعة أو تخصص"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 up-search-input"
            />
            <button type="submit"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl font-medium transition-colors">
              بحث
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* تنبيه البيانات التجريبية */}
        <div className="up-alert" role="note">
          <AlertTriangle size={14} aria-hidden="true" className="inline ml-1" />
          <strong>تنبيه:</strong> البيانات المعروضة تجريبية وتحتاج تحقق بشري. تأكد دائماً من الموقع
          الرسمي للجامعة قبل اتخاذ أي قرار.
        </div>

        {/* فلاتر */}
        <div className="up-filters-box">
          <FilterSelect label="الدولة"         value={filters.country || ""} onChange={(v) => setFilter("country", v)}       options={COUNTRIES} />
          <FilterSelect label="الدرجة العلمية" value={filters.degree_level || ""} onChange={(v) => setFilter("degree_level", v as UniversityFilters["degree_level"])} options={DEGREE_LEVELS} />
          <FilterSelect label="نظام الدراسة"   value={filters.study_mode || ""}   onChange={(v) => setFilter("study_mode", v as UniversityFilters["study_mode"])}   options={STUDY_MODES} />
          <FilterSelect label="لغة الدراسة"    value={filters.study_language || ""} onChange={(v) => setFilter("study_language", v)} options={LANGUAGES} />
          <div className="flex flex-col gap-1">
            <span className="up-filter-label">خيارات</span>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!filters.has_scholarship}
                  onChange={(e) => setFilter("has_scholarship", e.target.checked || undefined)}
                  className="accent-emerald-600" />
                <span className="up-filter-opt-label">منح متاحة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!filters.is_verified}
                  onChange={(e) => setFilter("is_verified", e.target.checked || undefined)}
                  className="accent-emerald-600" />
                <span className="up-filter-opt-label">موثقة فقط</span>
              </label>
            </div>
          </div>
        </div>

        {/* إحصائية */}
        <div className="flex items-center justify-between">
          <p className="up-count-text">
            {loading ? "جارٍ التحميل…" : `${universities.length} جامعة`}
            {search && `، نتائج "${search}"`}
          </p>
          {Object.values(filters).some(Boolean) || search ? (
            <button type="button"
              onClick={() => { setFilters({}); setSearch(""); setSearchInput(""); }}
              className="up-clear-btn">
              مسح الفلاتر
            </button>
          ) : null}
        </div>

        {/* Grid */}
        {seedNeeded && (
          <div className="up-empty-state">
            <Landmark size={40} strokeWidth={1.3} className="mx-auto mb-3" aria-hidden="true" />
            <p>جداول الجامعات لم تُطبَّق بعد على قاعدة البيانات.</p>
            <p className="text-xs mt-2">شغّل: <code className="up-code">node scripts/apply-universities-migrations.mjs</code></p>
          </div>
        )}

        {!seedNeeded && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="up-skeleton" />
            ))}
          </div>
        )}

        {!seedNeeded && !loading && universities.length === 0 && (
          <div className="up-empty-state up-empty-state--py12">
            <Search size={40} strokeWidth={1.3} className="mx-auto mb-3" aria-hidden="true" />
            <p>لا توجد نتائج مطابقة للبحث الحالي.</p>
          </div>
        )}

        {!seedNeeded && !loading && universities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universities.map((u) => (
              <UniversityCard key={u.id} university={u} />
            ))}
          </div>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="الجامعات الإسلامية — المجلس العلمي" url="https://majlisilm.com/universities" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["tarikh", "fiqh"]} title="اختبر معلوماتك في التاريخ الإسلامي" count={4} />
      </div>

      <CompareBar />
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <CompareProvider>
      <UniversitiesContent />
    </CompareProvider>
  );
}
