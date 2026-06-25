import { useEffect, useMemo, useState } from "react";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";
import { arabicMatchAny } from "@/lib/arabic-search";
import { DEMO_FAWAID, FAWAID_CATEGORIES, demoNoticeText, isDemoId } from "@/lib/demo-content";
import { canSubmitForm } from "@/lib/form-rate-limit";
import { PageHeader, Loading, Empty, DemoNotice } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import ContentActions from "@/components/ContentActions";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FawaidPage() {
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { user, isLoggedIn } = useAuth() as any;
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setLoading(true);
    getApprovedFawaid()
      .then(({ data, usingSeed }) => {
        setFawaid(data);
        setUsingDemo(Boolean(usingSeed));
      })
      .catch(() => {
        setFawaid(DEMO_FAWAID);
        setUsingDemo(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayItems = useMemo(() => {
    let items = fawaid;
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
  }, [fawaid, category, debouncedSearch]);

  const chips = useMemo(() => ["الكل", ...FAWAID_CATEGORIES], []);

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

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="مختارات نافعة"
        title="الفوائد"
        subtitle="فوائد شرعية مختصرة ومنظمة حسب الأقسام."
      />

      {usingDemo && <DemoNotice text={demoNoticeText("الفوائد")} />}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الفوائد..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الفوائد"
      />

      <div className="content-hub-chips">
        {chips.map((cat) => (
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

      {loading ? (
        <Loading />
      ) : displayItems.length === 0 ? (
        <Empty text={debouncedSearch.trim() ? `لا توجد فوائد مطابقة لـ «${debouncedSearch.trim()}».` : "لا توجد فوائد في هذا القسم."} />
      ) : (
        <div className="content-card-grid">
          {displayItems.map((f: any) => {
            const open = expandedId === f.id;
            const long = f.text.length > 140;
            const preview = long && !open ? `${f.text.slice(0, 140)}...` : f.text;
            return (
              <article key={f.id} className="content-mini-card">
                {f.category && <span className="content-mini-card__tag">{f.category}</span>}
                <p className="content-mini-card__body">{preview}</p>
                {long && (
                  <button
                    type="button"
                    className="content-mini-card__toggle"
                    onClick={() => setExpandedId(open ? null : f.id)}
                  >
                    {open ? "إخفاء" : "عرض كامل"}
                  </button>
                )}
                {(f.source || f.author_name) && (
                  <p className="content-mini-card__meta">
                    {f.source && <span>{f.source}</span>}
                    {f.author_name && <span>{f.author_name}</span>}
                  </p>
                )}
                {!isDemoId(f.id) && (
                  <div className="content-mini-card__actions">
                    <ContentActions contentType="benefit" contentId={f.id} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
