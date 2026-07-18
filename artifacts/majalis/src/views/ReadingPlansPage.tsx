import { useEffect, useMemo, useState } from "react";
import { BookOpen, Pause, Play, Plus, X } from "lucide-react";
import { PageHeader, Loading, Empty, Card } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { LIBRARY_CATALOG } from "@/lib/library-catalog";
import {
  fetchUserPlans, createPlan, logReadingProgress, pausePlan, resumePlan, cancelPlan,
  computePlanMetrics, estimatePlanFeasibility,
  type BookReadingPlan, type DayCode, type PaceLevel,
} from "@/lib/book-reading-plan-service";

const DAY_LABELS: Record<DayCode, string> = {
  sat: "سبت", sun: "أحد", mon: "اثنين", tue: "ثلاثاء", wed: "أربعاء", thu: "خميس", fri: "جمعة",
};
const ALL_DAYS: DayCode[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

const PACE_LABELS: Record<PaceLevel, string> = { easy: "ميسّرة", medium: "متوسطة", intensive: "مكثّفة" };

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة", not_started: "لم تبدأ", in_progress: "جارية", ahead: "متقدّم على الجدول",
  behind: "متأخر", paused: "متوقفة", completed: "مكتملة", cancelled: "ملغاة",
};
const STATUS_CLASS: Record<string, string> = {
  ahead: "rp-badge--ahead", behind: "rp-badge--behind", completed: "rp-badge--done",
  paused: "rp-badge--paused", in_progress: "rp-badge--active", not_started: "rp-badge--idle",
};

function PlanCard({ plan, onChanged }: { plan: BookReadingPlan; onChanged: () => void }) {
  const metrics = computePlanMetrics(plan);
  const [pagesToday, setPagesToday] = useState("");

  const handleLog = async () => {
    const n = Number(pagesToday);
    if (!n || n <= 0) return;
    await logReadingProgress(plan.id, Math.min(plan.total_pages, plan.current_page + n));
    setPagesToday("");
    onChanged();
  };

  return (
    <Card className="rp-plan-card">
      <div className="rp-plan-card__head">
        <h3 className="rp-plan-card__title">{plan.book_title}</h3>
        <span className={`rp-badge ${STATUS_CLASS[metrics.computedStatus] ?? ""}`}>
          {STATUS_LABELS[metrics.computedStatus] ?? metrics.computedStatus}
        </span>
      </div>

      <div className="rp-progress-bar">
        <div className="rp-progress-bar__fill" style={{ width: `${metrics.completionPct}%` }} />
      </div>
      <p className="rp-plan-card__meta">
        {metrics.actualPage} / {plan.total_pages} صفحة ({metrics.completionPct}%) ·
        {" "}متبقٍّ {metrics.remainingPages} صفحة في {metrics.remainingReadingDays} يوم قراءة
      </p>

      {metrics.computedStatus === "behind" && metrics.catchUpPagesPerDay != null && (
        <p className="rp-plan-card__catchup">
          للحاق بالجدول: اقرأ {metrics.catchUpPagesPerDay} صفحة في كل يوم قراءة متبقٍّ بدل {metrics.pagesPerReadingDay}.
        </p>
      )}

      {plan.status !== "paused" && plan.status !== "completed" && plan.status !== "cancelled" && (
        <div className="rp-plan-card__log">
          <input
            type="number"
            min={1}
            placeholder="أضِف صفحة وصلت إليها اليوم"
            value={pagesToday}
            onChange={(e) => setPagesToday(e.target.value)}
            className="rp-log-input"
            aria-label="الصفحة التي وصلت إليها اليوم"
          />
          <button type="button" onClick={handleLog} className="rp-log-btn">تسجيل</button>
        </div>
      )}

      <div className="rp-plan-card__actions">
        {plan.status === "paused" ? (
          <button type="button" onClick={() => resumePlan(plan.id).then(onChanged)} className="rp-action-btn">
            <Play size={13} /> استئناف
          </button>
        ) : plan.status !== "completed" && plan.status !== "cancelled" ? (
          <button type="button" onClick={() => pausePlan(plan.id).then(onChanged)} className="rp-action-btn">
            <Pause size={13} /> إيقاف مؤقت
          </button>
        ) : null}
        {plan.status !== "completed" && plan.status !== "cancelled" && (
          <button type="button" onClick={() => cancelPlan(plan.id).then(onChanged)} className="rp-action-btn rp-action-btn--danger">
            <X size={13} /> إلغاء
          </button>
        )}
      </div>
    </Card>
  );
}

function NewPlanForm({ userId, onCreated, onClose }: { userId: string; onCreated: () => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState("300");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [readingDays, setReadingDays] = useState<DayCode[]>([...ALL_DAYS]);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [pace, setPace] = useState<PaceLevel>("medium");
  const [includeReview, setIncludeReview] = useState(true);
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    return LIBRARY_CATALOG.filter((b) => b.title.includes(q)).slice(0, 8);
  }, [query]);
  const selectedBook = LIBRARY_CATALOG.find((b) => b.id === selectedSlug);

  const feasibility = useMemo(() => {
    const pages = Number(totalPages);
    if (!pages || !startDate || !endDate || readingDays.length === 0) return null;
    return estimatePlanFeasibility({
      totalPages: pages, startDate, endDate, readingDays, dailyMinutes, paceLevel: pace,
    });
  }, [totalPages, startDate, endDate, readingDays, dailyMinutes, pace]);

  const toggleDay = (d: DayCode) => {
    setReadingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = async () => {
    if (!selectedBook || !Number(totalPages) || readingDays.length === 0) return;
    setSaving(true);
    try {
      await createPlan(userId, {
        bookSlug: selectedBook.id,
        bookTitle: selectedBook.title,
        totalPages: Number(totalPages),
        startDate, endDate, readingDays, dailyMinutes, paceLevel: pace,
        includeReviewDays: includeReview,
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rp-new-plan">
      <div className="rp-new-plan__head">
        <h3>خطة قراءة جديدة</h3>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="rp-close-btn"><X size={16} /></button>
      </div>

      <label className="rp-field">
        <span>الكتاب</span>
        <input
          value={selectedBook ? selectedBook.title : query}
          onChange={(e) => { setQuery(e.target.value); setSelectedSlug(null); }}
          placeholder="ابحث عن كتاب في المكتبة..."
          className="rp-text-input"
        />
        {!selectedBook && matches.length > 0 && (
          <ul className="rp-suggestions">
            {matches.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => { setSelectedSlug(b.id); setQuery(""); }}>
                  {b.title} <span>— {b.author}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      <div className="rp-field-row">
        <label className="rp-field">
          <span>عدد الصفحات (حسب طبعتك)</span>
          <input type="number" min={1} value={totalPages} onChange={(e) => setTotalPages(e.target.value)} className="rp-text-input" />
        </label>
        <label className="rp-field">
          <span>الدقائق يوميًا</span>
          <input type="number" min={5} value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} className="rp-text-input" />
        </label>
      </div>

      <div className="rp-field-row">
        <label className="rp-field">
          <span>تاريخ البداية</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rp-text-input" />
        </label>
        <label className="rp-field">
          <span>تاريخ النهاية</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rp-text-input" />
        </label>
      </div>

      <div className="rp-field">
        <span>أيام القراءة</span>
        <div className="rp-days-grid">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              className={`rp-day-chip${readingDays.includes(d) ? " is-active" : ""}`}
              onClick={() => toggleDay(d)}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="rp-field">
        <span>مستوى الخطة</span>
        <div className="rp-days-grid">
          {(["easy", "medium", "intensive"] as PaceLevel[]).map((p) => (
            <button key={p} type="button" className={`rp-day-chip${pace === p ? " is-active" : ""}`} onClick={() => setPace(p)}>
              {PACE_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <label className="rp-checkbox-field">
        <input type="checkbox" checked={includeReview} onChange={(e) => setIncludeReview(e.target.checked)} />
        <span>أيام مراجعة مستقلة</span>
      </label>

      {feasibility && (
        <p className={`rp-feasibility${feasibility.feasible ? "" : " rp-feasibility--warn"}`}>
          {feasibility.warning ?? `معدّل واقعي: نحو ${feasibility.pagesPerReadingDay} صفحة في كل يوم قراءة.`}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !selectedBook || !Number(totalPages) || readingDays.length === 0}
        className="rp-submit-btn"
      >
        {saving ? "جارٍ الحفظ..." : "إنشاء الخطة"}
      </button>
    </Card>
  );
}

export default function ReadingPlansPage() {
  const { user, isLoggedIn } = useAuth();
  const [plans, setPlans] = useState<BookReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/reading-plans",
      title: "خطط القراءة | المجلس العلمي",
      description: "أنشئ خطة قراءة ذكية لأي كتاب: تاريخ بداية ونهاية، أيام قراءة، وتتبّع تقدّمك مقابل الجدول تلقائيًا.",
      robots: "noindex, follow",
    });
  }, []);

  const reload = () => {
    if (!user?.id) { setLoading(false); return; }
    fetchUserPlans(user.id).then(setPlans).finally(() => setLoading(false));
  };
  useEffect(reload, [user?.id]);

  return (
    <div className="page-shell narrow">
      <PageHeader
        eyebrow="تعلّم منظَّم"
        title="خطط القراءة"
        subtitle="خطة قراءة ذكية لأي كتاب — نتابع تقدّمك مقابل الجدول ونقترح التعويض عند التأخر."
      />

      {!isLoggedIn ? (
        <Empty text="سجّل الدخول لإنشاء خطط قراءة ومتابعة تقدّمك." />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <div className="rp-toolbar">
            <button type="button" onClick={() => setShowForm((v) => !v)} className="rp-new-btn">
              <Plus size={15} /> خطة جديدة
            </button>
          </div>

          {showForm && user?.id && (
            <NewPlanForm userId={user.id} onCreated={() => { setShowForm(false); reload(); }} onClose={() => setShowForm(false)} />
          )}

          {plans.length === 0 && !showForm ? (
            <div className="rp-empty">
              <BookOpen size={34} strokeWidth={1} aria-hidden="true" />
              <p>لا توجد خطط قراءة بعد</p>
            </div>
          ) : (
            <div className="rp-plans-list">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} onChanged={reload} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
