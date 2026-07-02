import { useCallback, useEffect, useState } from "react";
import { CompareProvider } from "@/components/universities/CompareContext";
import { CompareBar } from "@/components/universities/CompareBar";
import { UniversityCard } from "@/components/universities/UniversityCard";
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
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

  useEffect(() => { load(); }, [load]);

  function setFilter(key: keyof UniversityFilters, value: string | boolean | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-800 to-emerald-600 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">🎓 دليل الجامعات والكليات الشرعية</h1>
          <p className="text-emerald-100 text-sm max-w-xl mx-auto leading-relaxed">
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
              className="flex-1 px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none
                focus:ring-2 focus:ring-white/50"
            />
            <button type="submit"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm
                rounded-xl font-medium transition-colors">
              بحث
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* تنبيه البيانات التجريبية */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800
          rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ <strong>تنبيه:</strong> البيانات المعروضة تجريبية وتحتاج تحقق بشري. تأكد دائماً من الموقع
          الرسمي للجامعة قبل اتخاذ أي قرار.
        </div>

        {/* فلاتر */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect label="الدولة"         value={filters.country || ""} onChange={(v) => setFilter("country", v)}       options={COUNTRIES} />
          <FilterSelect label="الدرجة العلمية" value={filters.degree_level || ""} onChange={(v) => setFilter("degree_level", v as UniversityFilters["degree_level"])} options={DEGREE_LEVELS} />
          <FilterSelect label="نظام الدراسة"   value={filters.study_mode || ""}   onChange={(v) => setFilter("study_mode", v as UniversityFilters["study_mode"])}   options={STUDY_MODES} />
          <FilterSelect label="لغة الدراسة"    value={filters.study_language || ""} onChange={(v) => setFilter("study_language", v)} options={LANGUAGES} />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">خيارات</span>
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!filters.has_scholarship}
                  onChange={(e) => setFilter("has_scholarship", e.target.checked || undefined)}
                  className="accent-emerald-600" />
                <span className="text-sm text-gray-700 dark:text-gray-200">منح متاحة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!filters.is_verified}
                  onChange={(e) => setFilter("is_verified", e.target.checked || undefined)}
                  className="accent-emerald-600" />
                <span className="text-sm text-gray-700 dark:text-gray-200">موثقة فقط</span>
              </label>
            </div>
          </div>
        </div>

        {/* إحصائية */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "جارٍ التحميل…" : `${universities.length} جامعة`}
            {search && ` — نتائج "${search}"`}
          </p>
          {Object.values(filters).some(Boolean) || search ? (
            <button type="button"
              onClick={() => { setFilters({}); setSearch(""); setSearchInput(""); }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              مسح الفلاتر
            </button>
          ) : null}
        </div>

        {/* Grid */}
        {seedNeeded && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">🏛️</p>
            <p>جداول الجامعات لم تُطبَّق بعد على قاعدة البيانات.</p>
            <p className="text-xs mt-2">شغّل: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">node scripts/apply-universities-migrations.mjs</code></p>
          </div>
        )}

        {!seedNeeded && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-64 animate-pulse border border-gray-100 dark:border-gray-700" />
            ))}
          </div>
        )}

        {!seedNeeded && !loading && universities.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-4xl mb-3">🔍</p>
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
