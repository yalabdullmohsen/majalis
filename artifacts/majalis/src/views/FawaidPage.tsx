import { useEffect, useMemo, useState } from "react";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";
import { RequestManager } from "@/lib/request-manager";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { DEMO_FAWAID, FAWAID_CATEGORIES } from "@/lib/demo-content";
import { canSubmitForm } from "@/lib/form-rate-limit";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { useAuth } from "@/components/AuthProvider";
import { FaidahCard } from "@/components/fawaid/FaidahCard";
import { ShareButtons } from "@/components/ContentActions";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

const LEGACY_CATEGORIES = [
  "فوائد قرآنية",
  "فوائد حديثية",
  "فوائد عقدية",
  "فوائد فقهية",
  "فوائد تربوية",
  "فوائد دعوية",
  "فوائد سلوكية",
] as const;

const DISPLAY_CATEGORIES = ["الكل", ...FAWAID_CATEGORIES, ...LEGACY_CATEGORIES.filter((c) => !FAWAID_CATEGORIES.includes(c as never))] as const;

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FawaidPage({
  initialFawaid,
}: {
  initialFawaid?: any[];
} = {}) {
  useScrollRestore("/fawaid");
  const [fawaid, setFawaid] = useState<any[]>(initialFawaid ?? []);
  const [loading, setLoading] = useState(!initialFawaid);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user, isLoggedIn, isAdmin } = useAuth();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    applyPageSeo({
      path: "/fawaid",
      title: "الفوائد العلمية | المجلس العلمي",
      description: "منصة لنشر ومشاركة الفوائد العلمية والشرعية، فوائد قرآنية وحديثية وعقدية وفقهية وتربوية.",
      keywords: ["فوائد علمية", "فوائد شرعية", "فوائد قرآنية", "فوائد حديثية", "الفوائد الإسلامية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الفوائد العلمية",
          description: "أقسام الفوائد العلمية والشرعية على المنصة",
          itemListElement: FAWAID_CATEGORIES.map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://majlisilm.com/fawaid?cat=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (initialFawaid) return;
    setLoading(true);
    RequestManager.run("fawaid:list", () => getApprovedFawaid())
      .then(({ data }) => {
        setFawaid(data);
      })
      .catch(() => {
        setFawaid(DEMO_FAWAID);
      })
      .finally(() => setLoading(false));
  }, [initialFawaid]);

  const normalized = useMemo(() => {
    const arr = [...fawaid];
    const seed = Date.now();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(((seed * (i + 1)) % 2147483647) / 2147483647 * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [fawaid]);

  const displayItems = useMemo(() => {
    let items = normalized;
    if (category !== "الكل") {
      items = items.filter((f) => f.category === category);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim();
      items = items.filter((f) =>
        arabicMatchAny([f.text, f.category, f.source, f.author_name], q),
      );
    }
    return items;
  }, [normalized, category, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!canSubmitForm("fawaid-submit", 8000)) {
      setSubmitError("يرجى الانتظار قليلًا قبل إرسال فائدة أخرى.");
      return;
    }
    if (!user) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const { error: insertError } = await submitFawaid(user.id, text, authorName || user.profile?.full_name || "");
      if (insertError) throw insertError;
      setSubmitted(true);
      setText("");
      setAuthorName("");
    } catch {
      setSubmitError("تعذر إرسال الفائدة. حاول مجددًا.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الفوائد..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الفوائد"
      />
      <div className="content-hub-chips" role="tablist" aria-label="تصفية الفوائد">
        {DISPLAY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            aria-selected={category === cat}
          >
            {cat}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="page-shell narrow content-hub-page fawaid-page ds-page">
      <PageHeader
        eyebrow="مختارات نافعة"
        title="الفوائد"
        subtitle="فوائد شرعية موثقة ومنظمة."
      />

      <div className="ds-section__head">
        {isAdmin && (
          <div className="page-stats-row page-stats-row--flush">
            <span>{displayItems.length} فائدة</span>
            <span>{FAWAID_CATEGORIES.length} تصنيف</span>
          </div>
        )}
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {loading ? (
        <SkeletonCardGrid count={8} />
      ) : displayItems.length === 0 ? (
        <Empty text={debouncedSearch.trim() ? `لا توجد فوائد مطابقة لـ «${debouncedSearch.trim()}».` : "لا توجد فوائد في هذا القسم."} />
      ) : (
        <div className="faidah-grid">
          {displayItems.map((f) => (
            <FaidahCard key={f.id} item={f} />
          ))}
        </div>
      )}

      <RelatedKnowledge kind="fawaid" title="فوائد ذات صلة" />

      {isLoggedIn && (
        <div className="ui-card content-submit-panel">
          <h2>أرسل فائدة</h2>
          {submitted ? (
            <p className="content-submit-success">شكرًا. سيتم مراجعة الفائدة قبل نشرها.</p>
          ) : (
            <form onSubmit={handleSubmit} className="content-submit-form" aria-label="إرسال فائدة علمية">
              {submitError && <p className="content-submit-error" role="alert">{submitError}</p>}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="نص الفائدة"
                placeholder="اكتب الفائدة هنا..."
                rows={4}
              />
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="اسم الكاتب (اختياري)"
              />
              <button type="submit" disabled={submitting || !text.trim()}>
                {submitting ? "جارٍ الإرسال..." : "إرسال الفائدة"}
              </button>
            </form>
          )}
        </div>
      )}

      <aside className="ds-filters-panel ds-filters-panel--desktop">
        <div className="ds-filters-panel__head">
          <h2>بحث وتصفية</h2>
        </div>
        {filtersPanel}
      </aside>

      <div className="twh-share">
        <ShareButtons title="الفوائد العلمية — المجلس العلمي" url="https://majlisilm.com/fawaid" />
      </div>

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="hadith" title="اختبر معلوماتك في الحديث والفوائد" count={4} />
      </div>
    </div>
  );
}
