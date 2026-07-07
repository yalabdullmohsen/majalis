/**
 * KhatmahPanel — خطط الختمة وسلاسل القراءة والإحصائيات
 */
import { useState } from "react";
import {
  getKhatmahPlans,
  createKhatmahPlan,
  getStreak,
  getDailyReading,
  type KhatmahPlan,
} from "@/lib/quran-personal";

type Props = {
  currentPage: number;
  onClose: () => void;
};

const PLAN_PRESETS = [
  { label: "ختمة في 30 يوماً",  days: 30  },
  { label: "ختمة في 60 يوماً",  days: 60  },
  { label: "ختمة في 90 يوماً",  days: 90  },
  { label: "ختمة في 180 يوماً", days: 180 },
];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="kht-progress-bar">
      <div className="kht-prog-inner" style={{ "--kht-pct": `${pct}%` } as React.CSSProperties} />
    </div>
  );
}

function PlanCard({ plan, currentPage }: { plan: KhatmahPlan; currentPage: number }) {
  const daysLeft    = Math.max(0, Math.ceil((plan.targetEndAt - Date.now()) / 86400000));
  const daysTotal   = plan.targetDays;
  const daysElapsed = daysTotal - daysLeft;
  const expectedPages = Math.min(604, Math.round((daysElapsed / daysTotal) * 604));
  const actualPages   = currentPage;
  const isAhead       = actualPages >= expectedPages;
  const pagesPerDay   = Math.ceil((604 - actualPages) / Math.max(1, daysLeft));
  const done = actualPages >= 604 || plan.completedAt;

  return (
    <div className={`kht-plan-card${done ? " kht-plan-card--done" : " kht-plan-card--active"}`}>
      <div className="kht-plan-head">
        <strong className={`kht-plan-name${done ? " kht-plan-name--done" : ""}`}>
          {done ? "✅ " : ""}{plan.name}
        </strong>
        {!done && <span className="kht-plan-days">{daysLeft} يوم متبقٍّ</span>}
      </div>

      {!done && (
        <>
          <ProgressBar value={actualPages} max={604} />
          <div className="kht-progress-meta">
            <span>الصفحة {actualPages} / 604</span>
            <span className={isAhead ? "kht-progress-ahead" : "kht-progress-behind"}>
              {isAhead ? "أنت متقدم 🎉" : `متأخر (${expectedPages - actualPages} ص)`}
            </span>
          </div>
          <p className="kht-plan-daily">
            المطلوب اليوم: <strong className="kht-daily-highlight">{pagesPerDay} صفحة</strong>
          </p>
        </>
      )}
      {done && <p className="kht-plan-done-msg">تم إتمام الختمة بحمد الله! 🌟</p>}
    </div>
  );
}

export function KhatmahPanel({ currentPage, onClose }: Props) {
  const [plans, setPlans]       = useState<KhatmahPlan[]>(() => getKhatmahPlans());
  const [creating, setCreating] = useState(false);
  const [customDays, setCustomDays] = useState(30);
  const streak = getStreak();
  const reading = getDailyReading().slice(0, 7);
  const totalAyahs = reading.reduce((s, r) => s + r.ayahsRead, 0);

  function handleCreate(days: number) {
    const plan = createKhatmahPlan(`ختمة ${days} يوماً`, days);
    setPlans([plan, ...plans]);
    setCreating(false);
  }

  const STATS = [
    { label: "سلسلة الأيام",      value: `${streak.current} 🔥`, sub: `أعلى: ${streak.longest}` },
    { label: "الصفحة الحالية",    value: String(currentPage),    sub: "من 604" },
    { label: "آيات هذا الأسبوع", value: String(totalAyahs),     sub: "آية" },
  ];

  return (
    <>
      <div className="kht-backdrop" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="خطط الختمة والإحصائيات" className="kht-drawer">
        <div aria-hidden className="eap-handle" />

        <div className="kht-header">
          <h2 className="kht-title">📅 خطة الختمة والتقدم</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="kht-close">✕</button>
        </div>

        <div className="kht-body">
          <div className="kht-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="kht-stat-card">
                <div className="kht-stat-value">{s.value}</div>
                <div className="kht-stat-label">{s.label}</div>
                <div className="kht-stat-label">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="kht-plans-wrap">
            <div className="kht-plans-head">
              <h3 className="kht-plans-title">خطط الختمة</h3>
              <button type="button" onClick={() => setCreating(!creating)} className="kht-new-plan-btn">
                {creating ? "إلغاء" : "+ خطة جديدة"}
              </button>
            </div>

            {creating && (
              <div className="kht-create-box">
                <div className="kht-preset-pills">
                  {PLAN_PRESETS.map((p) => (
                    <button key={p.days} type="button" onClick={() => handleCreate(p.days)} className="kht-preset-btn">
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="kht-custom-row">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    className="kht-custom-input"
                  />
                  <span className="kht-custom-label">يوم</span>
                  <button type="button" onClick={() => handleCreate(customDays)} className="kht-create-btn">
                    إنشاء
                  </button>
                </div>
              </div>
            )}

            {plans.length === 0 && !creating && (
              <p className="kht-empty">لا توجد خطط بعد. أنشئ خطتك الأولى!</p>
            )}

            {plans.slice(0, 5).map((plan) => (
              <PlanCard key={plan.id} plan={plan} currentPage={currentPage} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
