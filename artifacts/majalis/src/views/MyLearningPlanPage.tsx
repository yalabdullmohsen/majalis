import { useEffect, useState } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/personal/RequireAuth";
import { Loading, PageHeader } from "@/components/ui-common";
import {
  fetchLearningPlan,
  saveLearningPlan,
  buildAutoPlan,
  logUserActivity,
  type LearningPlan,
} from "@/lib/personal-learning";

const LEVELS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
];

const INTERESTS = ["العقيدة", "الفقه", "التفسير", "الحديث", "السيرة", "التزكية", "اللغة العربية"];
const GOALS = [
  { value: "memorize", label: "حفظ" },
  { value: "read", label: "قراءة" },
  { value: "study", label: "دراسة" },
  { value: "review", label: "مراجعة" },
];

export default function MyLearningPlanPage() {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [goal, setGoal] = useState("study");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLearningPlan().then((p) => {
      setPlan(p);
      if (p) {
        setLevel(p.level);
        setInterests(p.interests || []);
        setDailyMinutes(p.daily_minutes);
        setGoal(p.goal);
      }
      setLoading(false);
    });
  }, []);

  const toggleInterest = (i: string) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const finishOnboarding = async () => {
    setSaving(true);
    const generated = buildAutoPlan({ level, interests, daily_minutes: dailyMinutes, goal });
    const saved = await saveLearningPlan({
      level,
      interests,
      daily_minutes: dailyMinutes,
      goal,
      ...generated,
      onboarding_done: true,
      reminders_enabled: true,
    });
    setPlan(saved);
    setSaving(false);
    await logUserActivity("plan_created");
  };

  const updateGoalProgress = async (goalId: string, period: "weekly" | "monthly") => {
    if (!plan) return;
    const key = period === "weekly" ? "weekly_goals" : "monthly_goals";
    const goals = [...(plan[key] as Array<{ id: string; done: number; target: number }>)];
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return;
    goals[idx] = { ...goals[idx], done: Math.min(goals[idx].target, goals[idx].done + 1) };
    const saved = await saveLearningPlan({ [key]: goals });
    setPlan(saved);
    await logUserActivity("plan_progress", period, goalId);
  };

  if (loading) return <RequireAuth><Loading /></RequireAuth>;

  const showOnboarding = !plan?.onboarding_done;

  return (
    <RequireAuth>
      <div className="page-shell personal-page" dir="rtl">
        <PageHeader
          eyebrow="مساحتي العلمية"
          title="خطة طلب العلم"
          subtitle="خطة شخصية ذكية — دروس، كتب، متون، ومراجعات أسبوعية"
        />

        <div className="personal-hub-links">
          <Link href="/my-library" className="ds-btn ds-btn--ghost ds-btn--sm">مكتبتي</Link>
          <Link href="/my-dashboard" className="ds-btn ds-btn--ghost ds-btn--sm">لوحة المستخدم</Link>
          <Link href="/my-profile" className="ds-btn ds-btn--ghost ds-btn--sm">ملفي العلمي</Link>
        </div>

        {showOnboarding ? (
          <div className="personal-onboarding">
            {step === 0 && (
              <section className="personal-panel">
                <h2>ما مستواك العلمي؟</h2>
                <div className="personal-chip-group">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      className={`personal-chip${level === l.value ? " active" : ""}`}
                      onClick={() => setLevel(l.value)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="ds-btn ds-btn--primary" onClick={() => setStep(1)}>التالي</button>
              </section>
            )}
            {step === 1 && (
              <section className="personal-panel">
                <h2>ما العلوم التي تهمك؟</h2>
                <div className="personal-chip-group">
                  {INTERESTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={`personal-chip${interests.includes(i) ? " active" : ""}`}
                      onClick={() => toggleInterest(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="personal-onboarding-nav">
                  <button type="button" className="ds-btn ds-btn--ghost" onClick={() => setStep(0)}>رجوع</button>
                  <button type="button" className="ds-btn ds-btn--primary" onClick={() => setStep(2)} disabled={!interests.length}>التالي</button>
                </div>
              </section>
            )}
            {step === 2 && (
              <section className="personal-panel">
                <h2>كم دقيقة يومياً؟</h2>
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                />
                <p>{dailyMinutes} دقيقة يومياً</p>
                <h2>ما هدفك؟</h2>
                <div className="personal-chip-group">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      className={`personal-chip${goal === g.value ? " active" : ""}`}
                      onClick={() => setGoal(g.value)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="personal-onboarding-nav">
                  <button type="button" className="ds-btn ds-btn--ghost" onClick={() => setStep(1)}>رجوع</button>
                  <button type="button" className="ds-btn ds-btn--primary" onClick={finishOnboarding} disabled={saving}>
                    {saving ? "جاري البناء..." : "بناء خطتي"}
                  </button>
                </div>
              </section>
            )}
          </div>
        ) : plan ? (
          <>
            <div className="personal-plan-summary">
              <span>المستوى: {LEVELS.find((l) => l.value === plan.level)?.label}</span>
              <span>{plan.daily_minutes} د/يوم</span>
              <span>{GOALS.find((g) => g.value === plan.goal)?.label}</span>
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => saveLearningPlan({ onboarding_done: false }).then(setPlan)}>
                إعادة الإعداد
              </button>
            </div>

            <section className="personal-panel">
              <h2>محتوى الخطة</h2>
              <div className="personal-plan-items">
                {((plan.plan_data as { items?: Array<{ id: string; title: string; url: string; type: string }> }).items || []).map((item) => (
                  <Link key={item.id} href={item.url} className="personal-plan-item">
                    <span className="personal-plan-type">{item.type}</span>
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>

            <div className="personal-profile-columns">
              <section className="personal-panel">
                <h2>أهداف أسبوعية</h2>
                {(plan.weekly_goals as Array<{ id: string; label: string; done: number; target: number }>).map((g) => (
                  <div key={g.id} className="personal-goal-row">
                    <span>{g.label}</span>
                    <span>{g.done}/{g.target}</span>
                    <button type="button" className="ds-btn ds-btn--sm ds-btn--primary" onClick={() => updateGoalProgress(g.id, "weekly")}>+1</button>
                  </div>
                ))}
              </section>
              <section className="personal-panel">
                <h2>أهداف شهرية</h2>
                {(plan.monthly_goals as Array<{ id: string; label: string; done: number; target: number }>).map((g) => (
                  <div key={g.id} className="personal-goal-row">
                    <span>{g.label}</span>
                    <span>{g.done}/{g.target}</span>
                    <button type="button" className="ds-btn ds-btn--sm ds-btn--primary" onClick={() => updateGoalProgress(g.id, "monthly")}>+1</button>
                  </div>
                ))}
              </section>
            </div>

            {plan.reminders_enabled && (
              <p className="personal-reminder-hint">💡 تذكير: تابع نشاطك يومياً — يظهر في إشعاراتك داخل المنصة</p>
            )}
          </>
        ) : null}
      </div>
    </RequireAuth>
  );
}
