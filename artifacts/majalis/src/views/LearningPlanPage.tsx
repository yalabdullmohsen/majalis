import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import {
  getUserLearningPlan,
  saveLearningPlan,
  generatePlanItems,
  markPlanItemDone,
  INTEREST_OPTIONS,
  DAILY_MINUTES_OPTIONS,
  LEVEL_LABELS,
  type PlanLevel,
  type InterestId,
  type LearningPlan,
  type PlanItem,
} from "@/lib/learning-plan-service";

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

type WizardStep = "level" | "interests" | "time" | "loading" | "plan";

function StepLevel({
  value,
  onChange,
}: {
  value: PlanLevel | "";
  onChange: (v: PlanLevel) => void;
}) {
  const options: { value: PlanLevel; label: string; desc: string; icon: string }[] = [
    { value: "beginner", label: "مبتدئ", desc: "أبدأ رحلتي في طلب العلم", icon: "🌱" },
    { value: "intermediate", label: "متوسط", desc: "لديّ قاعدة ولكنني أريد المزيد", icon: "📚" },
    { value: "advanced", label: "متقدم", desc: "طالب علم بخبرة واسعة", icon: "🏆" },
  ];

  return (
    <div className="lp-wizard__step">
      <h2 className="lp-wizard__step-title">ما مستواك في طلب العلم الشرعي؟</h2>
      <div className="lp-wizard__options">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`lp-wizard__option${value === o.value ? " lp-wizard__option--selected" : ""}`}
            onClick={() => onChange(o.value)}
          >
            <span className="lp-wizard__option-icon">{o.icon}</span>
            <span className="lp-wizard__option-label">{o.label}</span>
            <span className="lp-wizard__option-desc">{o.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepInterests({
  value,
  onChange,
}: {
  value: InterestId[];
  onChange: (v: InterestId[]) => void;
}) {
  const toggle = (id: InterestId) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div className="lp-wizard__step">
      <h2 className="lp-wizard__step-title">ما مجالات اهتمامك؟ (اختر واحداً أو أكثر)</h2>
      <div className="lp-wizard__interests">
        {INTEREST_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`lp-wizard__interest${value.includes(o.id) ? " lp-wizard__interest--selected" : ""}`}
            onClick={() => toggle(o.id)}
          >
            <span>{o.icon}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTime({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="lp-wizard__step">
      <h2 className="lp-wizard__step-title">كم دقيقة يمكنك التعلّم يومياً؟</h2>
      <div className="lp-wizard__options lp-wizard__options--time">
        {DAILY_MINUTES_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`lp-wizard__option${value === o.value ? " lp-wizard__option--selected" : ""}`}
            onClick={() => onChange(o.value)}
          >
            <span className="lp-wizard__option-label">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Plan display ─────────────────────────────────────────────────────────────

function PlanDisplay({
  plan,
  userId,
  onReset,
}: {
  plan: LearningPlan;
  userId: string;
  onReset: () => void;
}) {
  const [items, setItems] = useState<PlanItem[]>(plan.plan_items);
  const doneCount = items.filter((i) => i.done).length;

  const toggleDone = async (itemId: string, done: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, done } : i)));
    await markPlanItemDone(userId, itemId, done);
  };

  const TYPE_LABEL: Record<string, string> = { lesson: "درس", book: "كتاب", path: "مسار" };

  return (
    <div className="lp-plan">
      <div className="lp-plan__header">
        <div className="lp-plan__meta">
          <span className="lp-plan__level">{LEVEL_LABELS[plan.level]}</span>
          <span className="lp-plan__minutes">⏱ {plan.daily_minutes} دقيقة يومياً</span>
        </div>
        <div className="lp-plan__progress">
          <div className="lp-plan__progress-bar">
            <div
              className="lp-plan__progress-fill"
              style={{ "--plan-pct": items.length ? `${Math.round((doneCount / items.length) * 100)}%` : "0%" } as React.CSSProperties}
            />
          </div>
          <span className="lp-plan__progress-text">{doneCount} / {items.length}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="lp-plan__empty">لم يُعثر على محتوى مناسب. حاول تغيير اهتماماتك.</p>
      ) : (
        <ul className="lp-plan__list">
          {items.map((item) => (
            <li key={item.id} className={`lp-plan__item${item.done ? " lp-plan__item--done" : ""}`}>
              <button
                type="button"
                className="lp-plan__check"
                onClick={() => toggleDone(item.id, !item.done)}
                aria-label={item.done ? "إلغاء الإتمام" : "تحديد كمكتمل"}
              >
                {item.done ? "✓" : "○"}
              </button>
              <Link href={item.url} className="lp-plan__item-title">
                {item.title}
              </Link>
              <span className="lp-plan__item-type">{TYPE_LABEL[item.type] ?? item.type}</span>
              {item.category && (
                <span className="lp-plan__item-cat">{item.category}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="lp-plan__actions">
        <Link href="/flashcards" className="lp-plan__action-btn lp-plan__action-btn--primary">
          📇 مراجعة البطاقات
        </Link>
        <button type="button" className="lp-plan__action-btn" onClick={onReset}>
          ↺ إعادة بناء الخطة
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearningPlanPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [step, setStep] = useState<WizardStep>("level");
  const [level, setLevel] = useState<PlanLevel | "">("");
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing plan
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setPageLoading(false);
      return;
    }
    getUserLearningPlan(user.id)
      .then((p) => {
        if (p) {
          setPlan(p);
          setStep("plan");
        }
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, [isLoggedIn, user?.id]);

  const buildPlan = async () => {
    if (!user?.id || !level || interests.length === 0) return;
    setStep("loading");
    try {
      const items = await generatePlanItems(level as PlanLevel, interests, dailyMinutes);
      const saved = await saveLearningPlan(user.id, {
        level: level as PlanLevel,
        interests,
        daily_minutes: dailyMinutes,
        plan_items: items,
      });
      setPlan(saved);
      setStep("plan");
    } catch {
      setStep("time");
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow lpn-login-prompt" dir="rtl">
        <div className="lpn-login-icon">🔐</div>
        <p className="lpn-login-msg">
          سجّل الدخول لإنشاء خطة تعلّم شخصية.
        </p>
        <Link href="/login?next=/learning-plan" className="ui-card-btn">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const STEP_NUMBERS: Record<WizardStep, number> = { level: 1, interests: 2, time: 3, loading: 3, plan: 4 };
  const currentStepNum = STEP_NUMBERS[step];

  return (
    <div className="page-shell narrow lp-page" dir="rtl">
      <PageHeader
        eyebrow="التعلّم الذكي"
        title="خطة تعلّمك الشخصية"
        subtitle="نبني لك خطة علمية من محتوى التطبيق بناءً على مستواك واهتماماتك."
      />

      {step !== "plan" && step !== "loading" && (
        <div className="lp-wizard__steps">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`lp-wizard__step-dot${currentStepNum >= n ? " lp-wizard__step-dot--active" : ""}`}
            />
          ))}
        </div>
      )}

      {step === "level" && (
        <>
          <StepLevel value={level} onChange={(v) => { setLevel(v); }} />
          <div className="lp-wizard__nav">
            <button
              type="button"
              className="lp-wizard__next"
              disabled={!level}
              onClick={() => setStep("interests")}
            >
              التالي →
            </button>
          </div>
        </>
      )}

      {step === "interests" && (
        <>
          <StepInterests value={interests} onChange={setInterests} />
          <div className="lp-wizard__nav">
            <button type="button" className="lp-wizard__back" onClick={() => setStep("level")}>
              ← رجوع
            </button>
            <button
              type="button"
              className="lp-wizard__next"
              disabled={interests.length === 0}
              onClick={() => setStep("time")}
            >
              التالي →
            </button>
          </div>
        </>
      )}

      {step === "time" && (
        <>
          <StepTime value={dailyMinutes} onChange={setDailyMinutes} />
          <div className="lp-wizard__nav">
            <button type="button" className="lp-wizard__back" onClick={() => setStep("interests")}>
              ← رجوع
            </button>
            <button type="button" className="lp-wizard__next" onClick={buildPlan}>
              ابنِ خطتي ✨
            </button>
          </div>
        </>
      )}

      {step === "loading" && (
        <div className="lpn-building">
          <div className="profile-loading">
            <span className="profile-loading__dot" />
            <span className="profile-loading__dot" />
            <span className="profile-loading__dot" />
          </div>
          <p className="lpn-building__msg">جارٍ بناء خطتك…</p>
        </div>
      )}

      {step === "plan" && plan && user?.id && (
        <PlanDisplay
          plan={plan}
          userId={user.id}
          onReset={() => {
            setPlan(null);
            setLevel("");
            setInterests([]);
            setDailyMinutes(30);
            setStep("level");
          }}
        />
      )}
    </div>
  );
}
