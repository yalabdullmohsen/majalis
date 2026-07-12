import { useEffect, useMemo, useState } from "react";
import { Scale } from "lucide-react";
import { Link } from "wouter";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getFatwas } from "@/lib/platform-content-service";
import { getLatestFatwas, getMostReadFatwas, getMostSearchedFatwas } from "@/lib/fatwa-seed";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { FATWA_CATEGORIES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

const FIQH_HUB_TABS = [
  { key: "fatawa",  label: "الفتاوى",         href: "/fatwa" },
  { key: "rulings", label: "الأحكام الشرعية", href: "/rulings" },
  { key: "qa",      label: "الأسئلة الشرعية", href: "/qa" },
  { key: "council", label: "المجمع الفقهي",   href: "/fiqh-council" },
] as const;
type FiqhTab = (typeof FIQH_HUB_TABS)[number]["key"];

function FiqhHubStrip({ current }: { current: FiqhTab }) {
  return (
    <nav className="fiqh-hub-strip" dir="rtl" aria-label="الأقسام الشرعية">
      <Link href="/fiqh" className="fiqh-hub-strip__brand"><Scale size={14} className="inline ml-1" />الفقه الإسلامي</Link>
      <span className="fiqh-hub-strip__sep" aria-hidden="true">·</span>
      {FIQH_HUB_TABS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`fiqh-hub-strip__tab${item.key === current ? " fiqh-hub-strip__tab--active" : ""}`}
          aria-current={item.key === current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FatwaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [format, setFormat] = useState("الكل");
  const [tab, setTab] = useState<"all" | "latest" | "popular" | "searched">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("fatwa", null);

  useEffect(() => {
    const topFatwas = getMostReadFatwas(8).filter((f: any) => f.answer);
    const faqSchema = topFatwas.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: topFatwas.map((f: any) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : undefined;
    applyPageSeo({
      path: "/fatwa",
      title: "الفتاوى الشرعية | المجلس العلمي",
      description: "مكتبة الفتاوى الشرعية الموثقة، تصفح فتاوى أئمة وعلماء الشريعة الإسلامية في الفقه والعبادات والمعاملات.",
      keywords: ["فتاوى", "فتوى شرعية", "أحكام شرعية", "علماء مسلمون", "فقه إسلامي"],
      ...(faqSchema ? { jsonLd: [faqSchema] } : {}),
    });
  }, []);

  useEffect(() => {
    if (tab !== "all") {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFatwas({ category, format, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, format, debouncedSearch, tab]);

  const displayItems = useMemo(() => {
    if (tab === "latest") return getLatestFatwas(20);
    if (tab === "popular") return getMostReadFatwas(20);
    if (tab === "searched") return getMostSearchedFatwas(20);
    return items;
  }, [tab, items]);

  const formatLabel = (f: string) =>
    f === "written" ? "مكتوبة" : f === "audio" ? "صوتية" : "مكتوبة وصوتية";

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="مركز الفتاوى"
        title="الفتاوى الشرعية"
        subtitle="أحدث الفتاوى والأكثر قراءة والأكثر بحثاً، مكتوبة وصوتية مع تصنيف وبحث ذكي."
      />

      <FiqhHubStrip current="fatawa" />

      {/* شريط المنهجية */}
      <div className="ai-disclaimer-bar" role="note" dir="rtl">
        <Scale size={14} className="ai-disclaimer-bar__icon" aria-hidden="true" />
        <span>
          الفتاوى مصدرها علماء وجهات إفتاء معتمدة — للمسائل الشخصية الحساسة استشر عالماً مختصاً.{" "}
          <a href="/methodology" className="font-semibold underline" style={{ color: "#0E6E52" }}>منهجيتنا العلمية</a>
        </span>
      </div>

      <div className="content-hub-chips">
        {[
          ["all", "جميع الفتاوى"],
          ["latest", "أحدث الفتاوى"],
          ["popular", "الأكثر قراءة"],
          ["searched", "الأكثر بحثاً"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as typeof tab)}
            className={tab === key ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            aria-pressed={tab === key}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الفتاوى..."
            className="page-search-input full content-hub-search"
            aria-label="بحث في الفتاوى"
          />

          <div className="content-hub-chips">
            {["الكل", ...FATWA_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
                aria-pressed={category === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="content-hub-chips ftp-chips-sub">
            {[["الكل", "الكل"], ["written", "مكتوبة"], ["audio", "صوتية"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFormat(val)}
                className={format === val ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
                aria-pressed={format === val}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && tab === "all" ? (
        <SkeletonCardGrid count={9} />
      ) : displayItems.length === 0 ? (
        <Empty text="لا توجد فتاوى مطابقة." />
      ) : (
        <div className="page-card-grid">
          {displayItems.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/fatwa/${item.id}`}
              title={item.question}
              tag={formatLabel(item.format)}
              meta={[item.category, item.mufti_name].filter(Boolean).join(" · ")}
              summary={item.summary || item.answer?.slice(0, 120)}
            />
          ))}
        </div>
      )}
      <div className="twh-share">
        <ShareButtons title="الفتاوى الشرعية — المجلس العلمي" url="https://majlisilm.com/fatwa" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      </div>
      <AdminQuickEdit section="fatwa" />
    </div>
  );
}
