import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatSupabaseError,
  getQaCategories,
  getQaQuestions,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { C, QA_RULING_COLORS, QA_REVIEW_LABELS, QA_DISCLAIMER } from "@/lib/theme";
import {
  PageHeader,
  Empty,
  ErrorState,
  DemoNotice,
  QaSkeleton,
} from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { DEMO_QA, DEMO_QA_CATEGORIES, demoNoticeText, isDemoId } from "@/lib/demo-content";

function Disclaimer() {
  return (
    <div className="qa-disclaimer">
      <span aria-hidden="true">⚠️</span>
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

function ReviewBadge({ status }: { status: string }) {
  const approved = status === "approved";
  return (
    <span
      className="qa-badge"
      style={{
        background: approved ? "#D1FAE5" : "#FEF3C7",
        color: approved ? "#065F46" : "#92400E",
      }}
    >
      {approved ? "✓ " : "↻ "}
      {QA_REVIEW_LABELS[status] || status}
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
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(false);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const { data, error: fetchError, usingDemo: demo } = await getQaCategories();
      if (fetchError && !demo) {
        setCategories(DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
        console.error("[majalis:QaPage] categories", fetchError);
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error("[majalis:QaPage] categories", err);
      setCategories(DEMO_QA_CATEGORIES.filter((c) => c.id !== "all"));
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError, usingDemo: demo } = await getQaQuestions({
        categoryId,
        search: debouncedSearch,
      });

      setUsingDemo(demo);
      setItems(data);

      if (fetchError) {
        console.error("[majalis:QaPage] questions", fetchError, { categoryId, search: debouncedSearch });
        if (!demo || data.length === 0) {
          setError(formatSupabaseError(fetchError));
        }
      } else if (!isSupabaseConfigured() && data.length === 0) {
        setUsingDemo(true);
        setItems(DEMO_QA);
      }
    } catch (err) {
      console.error("[majalis:QaPage] questions", err);
      setError(formatSupabaseError(err));
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
    [categories]
  );

  const emptyMessage = useMemo(() => {
    if (debouncedSearch.trim()) {
      return `لا توجد أسئلة مطابقة لـ «${debouncedSearch.trim()}».`;
    }
    if (categoryId !== "all") {
      return "لا توجد أسئلة في هذا التصنيف بعد.";
    }
    return "لا توجد أسئلة منشورة بعد. سيتم عرض المحتوى فور إضافته من لوحة التحكم.";
  }, [categoryId, debouncedSearch]);

  const showDemoNotice = usingDemo && !error;

  return (
    <div className="page-shell narrow qa-page">
      <PageHeader
        eyebrow="مجالس العلم"
        title="الأسئلة والأجوبة الدينية"
        subtitle="مجموعة من الأسئلة والأجوبة العلمية المدعّمة بالأدلة الشرعية والمراجع، مرتّبة حسب التصنيف."
      />

      <Disclaimer />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأسئلة والأجوبة..."
        className="page-search-input full qa-search-input"
        aria-label="بحث في الأسئلة والأجوبة"
      />

      <div className="qa-chip-row">
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
                className={active ? "qa-chip qa-chip--active" : "qa-chip"}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {showDemoNotice && <DemoNotice text={demoNoticeText("الأسئلة والأجوبة")} />}

      {!isSupabaseConfigured() && !showDemoNotice && (
        <p className="qa-config-hint">
          Supabase غير مُعدّ — يُعرض محتوى تجريبي. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.
        </p>
      )}

      {loading ? (
        <QaSkeleton count={5} />
      ) : error && items.length === 0 ? (
        <ErrorState
          text={`${error}${!isSupabaseConfigured() ? " (وضع تجريبي غير متاح)" : ""}`}
          onRetry={loadQuestions}
        />
      ) : items.length === 0 ? (
        <Empty text={emptyMessage} />
      ) : (
        <>
          {error && (
            <p className="qa-inline-error" role="alert">
              {error} — نعرض النتائج المتاحة أو المحتوى التجريبي.
            </p>
          )}
          <div className="qa-list">
            {items.map((q: any) => {
              const open = openId === q.id;
              const catName = q.qa_categories?.name;
              return (
                <article key={q.id} className="qa-item">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : q.id)}
                    className={open ? "qa-item__head qa-item__head--open" : "qa-item__head"}
                    aria-expanded={open}
                  >
                    <span className="qa-item__chevron" aria-hidden="true">
                      ◂
                    </span>
                    <span className="qa-item__summary">
                      <span className="qa-item__question">{q.question}</span>
                      <span className="qa-item__meta">
                        {catName && <span className="qa-item__category">{catName}</span>}
                        {q.ruling_type && <RulingBadge ruling={q.ruling_type} />}
                        {q.review_status && <ReviewBadge status={q.review_status} />}
                      </span>
                    </span>
                  </button>

                  {open && (
                    <div className="qa-item__body">
                      <p className="qa-item__answer">{q.answer}</p>

                      {q.evidence && (
                        <div className="qa-item__evidence">
                          <p className="qa-item__evidence-label">الدليل الشرعي</p>
                          <p>{q.evidence}</p>
                        </div>
                      )}

                      <div className="qa-item__footer">
                        {q.reference ? (
                          <p>
                            <strong>المرجع:</strong> {q.reference}
                          </p>
                        ) : (
                          <span />
                        )}
                        {q.created_at && (
                          <p>{new Date(q.created_at).toLocaleDateString("ar-KW")}</p>
                        )}
                      </div>

                      {!isDemoId(q.id) && (
                        <div className="qa-item__actions">
                          <ContentActions contentType="qa" contentId={q.id} />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
