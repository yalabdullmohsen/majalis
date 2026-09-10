import { useEffect, useState } from "react";
import { BookOpen, Building2, GraduationCap, Globe, Library, MapPin, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import "@/styles/pages/institutions.css";

import { INSTITUTIONS, type Institution } from "@/data/institutions-catalog";

const TYPE_LABELS: Record<Institution["type"], string> = {
  mosque: "المساجد",
  center: "المراكز الإسلامية",
  university: "الجامعات",
  library: "المكتبات",
};

const TYPE_ICONS: Record<Institution["type"], LucideIcon> = {
  mosque: Building2,
  center: Library,
  university: GraduationCap,
  library: BookOpen,
};

const TYPE_FILTERS: { key: Institution["type"] | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "mosque", label: "المساجد" },
  { key: "university", label: "الجامعات" },
  { key: "center", label: "المراكز" },
  { key: "library", label: "المكتبات" },
];

// ─── Institution Card ─────────────────────────────────────────────────────────

function InstitutionCard({ inst }: { inst: Institution }) {
  return (
    <div className="inst-card soft-card soft-card--on-light mj-pressable" id={inst.id}>
      <div className="inst-card__head">
        <span className="inst-card__icon" aria-hidden="true">{(() => { const I = TYPE_ICONS[inst.type]; return <I size={22} strokeWidth={1.5} />; })()}</span>
        <div className="inst-card__meta">
          <h3 className="inst-card__name">{inst.name}</h3>
          <span className="inst-card__location">
            {inst.city}، {inst.country}
          </span>
        </div>
        <span className="inst-card__type-badge">{TYPE_LABELS[inst.type]}</span>
      </div>
      <p className="inst-card__desc">{inst.description}</p>
      <div className="inst-card__links">
        {inst.website && (
          <a
            href={inst.website}
            className="inst-card__link inst-card__link--web"
            target="_blank" rel="noopener noreferrer"
          >
            <Globe size={13} strokeWidth={1.8} aria-hidden="true" /> الموقع الرسمي
          </a>
        )}
        {inst.mapQuery && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(inst.mapQuery)}`}
            className="inst-card__link inst-card__link--map"
            target="_blank" rel="noopener noreferrer"
          >
            <MapPin size={13} strokeWidth={1.8} aria-hidden="true" /> الموقع على الخريطة
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstitutionsPage() {
  const [filter, setFilter] = useState<Institution["type"] | "all">("all");

  useEffect(() => {
    applyPageSeo({
      path: "/institutions",
      title: "المؤسسات الإسلامية | سُنّة",
      description: "دليل المؤسسات الإسلامية والمراكز الشرعية، مساجد ومعاهد وجامعات وهيئات إسلامية.",
      keywords: ["مؤسسات إسلامية", "مراكز إسلامية", "معاهد شرعية", "جامعات إسلامية", "هيئات دينية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "المؤسسات الإسلامية الكبرى",
          description: "دليل المساجد والمعاهد والجامعات والهيئات الإسلامية حول العالم.",
          numberOfItems: INSTITUTIONS.length,
          itemListElement: INSTITUTIONS.slice(0, 20).map((inst, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${inst.name} — ${inst.city}`,
            url: `https://www.ssunnah.com/institutions#${inst.id}`,
          })),
        },
      ],
    });
  }, []);
  const [search, setSearch] = useState("");

  const filtered = INSTITUTIONS.filter((inst) => {
    const matchType = filter === "all" || inst.type === filter;
    const matchSearch = arabicMatchAny([inst.name, inst.city, inst.country, inst.description], search);
    return matchType && matchSearch;
  });

  return (
    <SectionTemplatePage
      route="/institutions"
      title="دليل المؤسسات الإسلامية"
      subtitle="فهرس بأبرز المساجد والجامعات والمراكز البحثية والمكتبات الإسلامية في العالم."
      eyebrow="الدليل الإسلامي"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الدليل الإسلامي", href: "/islamic-directory" },
        { label: "المؤسسات" },
      ]}
    >
      <div className="inst-page" dir="rtl">
        <div className="inst-search-wrap">
          <input
            type="text"
            className="vault-search"
            aria-label="ابحث باسم المؤسسة أو البلد أو المدينة…"
            placeholder="ابحث باسم المؤسسة أو البلد أو المدينة…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            dir="rtl"
          />
          {search && (
            <button type="button" className="vault-search-clear" onClick={() => setSearch("")} aria-label="مسح البحث">
              ✕
            </button>
          )}
        </div>

        <div className="inst-filters" role="tablist" aria-label="تصفية حسب نوع المؤسسة">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`vault-tab${filter === f.key ? " vault-tab--active" : ""}`}
              onClick={() => setFilter(f.key as Institution["type"] | "all")}
            >
              {f.label}
              <span className="vault-tab__count">
                {f.key === "all"
                  ? INSTITUTIONS.length
                  : INSTITUTIONS.filter((i) => i.type === f.key).length}
              </span>
            </button>
          ))}
        </div>

        {search && <p className="inst-results-count">{filtered.length} نتيجة لـ "{search}"</p>}

        {filtered.length === 0 ? (
          <div className="vault-empty">
            <div className="vault-empty__icon" aria-hidden="true">
              <Search size={40} strokeWidth={1.3} />
            </div>
            <p>لا توجد نتائج مطابقة.</p>
          </div>
        ) : (
          <div className="inst-grid">
            {filtered.map((inst) => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>
        )}

        <p className="inst-disclaimer">
          * هذا الدليل مرجعي تعريفي. للتحقق من المعلومات يُرجى مراجعة المواقع الرسمية لكل مؤسسة.
        </p>

        <div className="twh-share">
          <ShareButtons title="المؤسسات الإسلامية — سُنّة" url="https://www.ssunnah.com/institutions" />
        </div>
        <div className="px-4 pb-6 mt-4">
          <SectionQuiz sectionId="islamic-history" title="اختبر معلوماتك في العلوم الإسلامية" count={4} />
        </div>
      </div>
    </SectionTemplatePage>
  );
}
