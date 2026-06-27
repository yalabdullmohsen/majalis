import { useEffect, useMemo, useState } from "react";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { arabicMatchAny } from "@/lib/arabic-search";
import { DEMO_FAWAID, FAWAID_CATEGORIES } from "@/lib/demo-content";
import { canSubmitForm } from "@/lib/form-rate-limit";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { useAuth } from "@/components/AuthProvider";
import { FaidahCard } from "@/components/fawaid/FaidahCard";
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
  const { user, isLoggedIn } = useAuth() as any;
  const debouncedSearch = useDebouncedValue(search);

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

  const normalized = useMemo(() => fawaid, [fawaid]);

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
    setSubmitError("");
    setSubmitting(true);
    try {
      const { error: insertError } = await submitFawaid(user.id, text, authorName || user?.profile?.full_name || "");
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
      <div className="content-hub-chips">
        {DISPLAY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
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
        <div className="page-stats-row" style={{ marginBottom: 0 }}>
          <span>{displayItems.length} فائدة</span>
          <span>{FAWAID_CATEGORIES.length} تصنيف</span>
        </div>
        <FilterToggle onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      {loading ? (
        <Loading />
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
            <form onSubmit={handleSubmit} className="content-submit-form">
              {submitError && <p className="content-submit-error" role="alert">{submitError}</p>}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
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

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>
    </div>
  );
}
