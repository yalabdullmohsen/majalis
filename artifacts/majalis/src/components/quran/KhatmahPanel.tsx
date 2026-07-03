/**
 * KhatmahPanel — خطط الختمة وسلاسل القراءة والإحصائيات
 */
import { useState } from "react";
import { C } from "@/lib/theme";
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
  { label: "ختمة في 30 يوماً",  days: 30,  pagesPerDay: 20  },
  { label: "ختمة في 60 يوماً",  days: 60,  pagesPerDay: 10  },
  { label: "ختمة في 90 يوماً",  days: 90,  pagesPerDay: 7   },
  { label: "ختمة في 180 يوماً", days: 180, pagesPerDay: 3.5 },
];

function ProgressBar({ value, max, color = C.emerald }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ width: "100%", height: "8px", background: "#e5e3dd", borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.4s" }} />
    </div>
  );
}

function PlanCard({ plan, currentPage }: { plan: KhatmahPlan; currentPage: number }) {
  const daysLeft = Math.max(0, Math.ceil((plan.targetEndAt - Date.now()) / 86400000));
  const daysTotal = plan.targetDays;
  const daysElapsed = daysTotal - daysLeft;
  const expectedPages = Math.min(604, Math.round((daysElapsed / daysTotal) * 604));
  const actualPages = currentPage;
  const isAhead = actualPages >= expectedPages;
  const pagesPerDay = Math.ceil((604 - actualPages) / Math.max(1, daysLeft));
  const done = actualPages >= 604 || plan.completedAt;

  return (
    <div style={{
      border: `1px solid ${done ? C.emerald : C.line}`,
      borderRadius: "0.75rem",
      padding: "0.875rem",
      background: done ? "#F0FDF4" : "var(--majalis-panel)",
      marginBottom: "0.75rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <strong style={{ fontSize: "0.9rem", color: done ? C.emeraldDeep : "var(--majalis-ink)" }}>
          {done ? "✅ " : ""}{plan.name}
        </strong>
        {!done && (
          <span style={{ fontSize: "0.72rem", color: C.inkSoft }}>
            {daysLeft} يوم متبقٍّ
          </span>
        )}
      </div>

      {!done && (
        <>
          <ProgressBar value={actualPages} max={604} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: C.inkSoft, marginTop: "0.3rem" }}>
            <span>الصفحة {actualPages} / 604</span>
            <span style={{ color: isAhead ? "#065F46" : "#991B1B", fontWeight: 600 }}>
              {isAhead ? "أنت متقدم 🎉" : `متأخر (${expectedPages - actualPages} ص)`}
            </span>
          </div>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: C.inkSoft }}>
            المطلوب اليوم: <strong style={{ color: "var(--majalis-ink)" }}>{pagesPerDay} صفحة</strong>
          </p>
        </>
      )}
      {done && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: C.emeraldDeep }}>
          تم إتمام الختمة بحمد الله! 🌟
        </p>
      )}
    </div>
  );
}

export function KhatmahPanel({ currentPage, onClose }: Props) {
  const [plans, setPlans] = useState<KhatmahPlan[]>(() => getKhatmahPlans());
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

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 8800, background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="خطط الختمة والإحصائيات"
        style={{
          position: "fixed",
          bottom: 0, right: 0, left: 0,
          zIndex: 8801,
          background: "var(--majalis-parchment, #faf9f6)",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.2)",
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          direction: "rtl",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Handle */}
        <div aria-hidden style={{ width: "40px", height: "4px", borderRadius: "2px", background: "#c9c6c0", margin: "0.75rem auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.emeraldDeep }}>📅 خطة الختمة والتقدم</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: C.inkSoft, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", WebkitOverflowScrolling: "touch" }}>

          {/* إحصائيات سريعة */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { label: "سلسلة الأيام", value: `${streak.current} 🔥`, sub: `أعلى: ${streak.longest}` },
              { label: "الصفحة الحالية", value: String(currentPage), sub: `من 604` },
              { label: "آيات هذا الأسبوع", value: String(totalAyahs), sub: "آية" },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: "0.6rem",
                background: C.parchmentDeep,
                borderRadius: "0.6rem",
                textAlign: "center",
                border: `1px solid ${C.line}`,
              }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: C.emeraldDeep }}>{stat.value}</div>
                <div style={{ fontSize: "0.65rem", color: C.inkSoft }}>{stat.label}</div>
                <div style={{ fontSize: "0.65rem", color: C.inkSoft }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* خطط الختمة */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--majalis-ink)" }}>خطط الختمة</h3>
              <button
                type="button"
                onClick={() => setCreating(!creating)}
                style={{ fontSize: "0.8rem", color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}
              >
                {creating ? "إلغاء" : "+ خطة جديدة"}
              </button>
            </div>

            {creating && (
              <div style={{ padding: "0.75rem", background: C.parchmentDeep, borderRadius: "0.6rem", marginBottom: "0.75rem", border: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  {PLAN_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => handleCreate(p.days)}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "2rem",
                        border: `1px solid ${C.emerald}`,
                        background: C.sage,
                        color: C.emeraldDeep,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    style={{ width: "70px", padding: "0.3rem", border: `1px solid ${C.line}`, borderRadius: "0.4rem", fontFamily: "inherit", textAlign: "center" }}
                  />
                  <span style={{ fontSize: "0.82rem", color: C.inkSoft }}>يوم</span>
                  <button
                    type="button"
                    onClick={() => handleCreate(customDays)}
                    style={{ padding: "0.3rem 0.75rem", border: "none", borderRadius: "0.4rem", background: C.emerald, color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}
                  >
                    إنشاء
                  </button>
                </div>
              </div>
            )}

            {plans.length === 0 && !creating && (
              <p style={{ color: C.inkSoft, fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>
                لا توجد خطط بعد. أنشئ خطتك الأولى!
              </p>
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
