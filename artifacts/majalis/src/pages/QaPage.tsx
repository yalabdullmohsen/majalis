import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getQaCategories,
  getQaQuestions,
} from "@/lib/supabase";
import { C, QA_RULING_COLORS, QA_DISCLAIMER } from "@/lib/theme";
import {
  PageHeader,
  Empty,
  DemoNotice,
  QaSkeleton,
} from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { DEMO_QA, DEMO_QA_CATEGORIES, demoNoticeText, isDemoId } from "@/lib/demo-content";

function Disclaimer() {
  return (
    <div className="qa-disclaimer">
      <p>{QA_DISCLAIMER}</p>
    </div>
  );
}

function RulingBadge({ ruling }: { ruling: string }) {
  const c = QA_RULING_COLORS[ruling] || { bg: C.parchmentDeep, text: C.inkSoft };
  return (
    <span className="qa-badge" style={{ background: c.bg, color: c.text }}>
      {ruling}
    </span>
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

export default function QaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await getQaCategories();
      setCategories(data?.length ? data : DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
    } catch {
      setCategories(DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, usingDemo: demo } = await getQaQuestions({
        categoryId,
        search: debouncedSearch,
      });
      setUsingDemo(Boolean(demo));
      setItems(data.length > 0 ? data : DEMO_QA);
    } catch {
      setUsingDemo(true);
      setItems(DEMO_QA);
    } finally {
      setLoading(false);
    }
  }, [categoryId, debouncedSearch]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const chips = useMemo(
    () => [{ id: "all", name: "الكل" }, ...categories],
    [categories],
  );

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `لا توجد أسئلة مطابقة لـ «${debouncedSearch.trim()}».`;
    }
    if (categoryId !== "all") {
      return "لا توجد أسئلة في هذا التصنيف.";
    }
    return "لا توجد أسئلة منشورة.";
  }, [categoryId, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page qa-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الأسئلة والأجوبة الدينية"
        subtitle="أسئلة وأجوبة علمية عامة مرتّبة حسب الأقسام."
      />

      <Disclaimer />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأسئلة والأجوبة..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الأسئلة والأجوبة"
      />

      <div className="content-hub-chips">
        {categoriesLoading ? (
          <QaSkeleton count={3} />
        ) : (
          chips.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={active ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {usingDemo && <DemoNotice text={demoNoticeText("الأسئلة والأجوبة")} />}

      {loading ? (
        <QaSkeleton count={6} />
      ) : items.length === 0 ? (
        <Empty text={emptyMessage} />
      ) : (
        <div className="content-card-grid content-card-grid--qa">
          {items.map((q: any) => {
            const open = openId === q.id;
            const catName = q.qa_categories?.name;
            return (
              <article key={q.id} className={`content-mini-card content-mini-card--qa${open ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="content-mini-card__head"
                  onClick={() => setOpenId(open ? null : q.id)}
                  aria-expanded={open}
                >
                  <span className="content-mini-card__question">{q.question}</span>
                  <span className="content-mini-card__meta-row">
                    {catName && <span className="content-mini-card__tag">{catName}</span>}
                    {q.ruling_type && <RulingBadge ruling={q.ruling_type} />}
                  </span>
                </button>

                {open && (
                  <div className="content-mini-card__details">
                    <p className="content-mini-card__answer">{q.answer}</p>
                    {q.evidence && (
                      <div className="content-mini-card__evidence">
                        <strong>الدليل:</strong> {q.evidence}
                      </div>
                    )}
                    {q.reference && (
                      <p className="content-mini-card__ref">
                        <strong>المرجع:</strong> {q.reference}
                      </p>
                    )}
                    {!isDemoId(q.id) && (
                      <div className="content-mini-card__actions">
                        <ContentActions contentType="qa" contentId={q.id} />
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
