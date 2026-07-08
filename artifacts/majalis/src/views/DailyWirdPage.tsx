import { useEffect, useState } from "react";
import { BookOpen, Leaf } from "lucide-react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  getDailyWirdState,
  getSurahList,
  saveDailyWirdState,
} from "@/lib/quran-api";
import { incrementTaskProgress } from "@/lib/daily-progress";
import { applyPageSeo } from "@/lib/seo";

function toAr(n: number): string {
  return n.toLocaleString("ar-EG", { useGrouping: false });
}

function WirdRing({ pct, pages, target }: { pct: number; pages: number; target: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const done = pct >= 1;
  return (
    <svg width="148" height="148" viewBox="0 0 148 148" className="wird-ring" aria-hidden="true">
      <circle cx="74" cy="74" r={r} fill="none" stroke="rgba(22,163,74,0.12)" strokeWidth="9" />
      <circle
        cx="74" cy="74" r={r}
        fill="none"
        stroke={done ? "#16A34A" : "#22C55E"}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(pct, 1))}
        transform="rotate(-90 74 74)"
        className="dwd-ring-fill"
      />
      <text x="74" y="67" textAnchor="middle" fill={done ? "#16A34A" : "#18362A"}
        fontSize="24" fontWeight="800" fontFamily="inherit">
        {toAr(pages)}
      </text>
      <text x="74" y="84" textAnchor="middle" fill="rgba(24,54,42,0.5)"
        fontSize="10.5" fontWeight="600" fontFamily="inherit">
        من {toAr(target)} صفحة
      </text>
      {done && (
        <text x="74" y="100" textAnchor="middle" fill="#16A34A"
          fontSize="12" fontWeight="700" fontFamily="inherit">✓ اكتمل</text>
      )}
    </svg>
  );
}

export default function DailyWirdPage() {
  const [state, setState] = useState(getDailyWirdState);
  const surahs = getSurahList();

  useEffect(() => {
    applyPageSeo({
      path: "/daily-wird",
      title: "الورد اليومي من القرآن | المجلس العلمي",
      description: "تتبّع وردك اليومي من القرآن الكريم — حدّد هدفك اليومي من الصفحات وتابع تقدمك نحو ختم القرآن.",
      keywords: ["ورد يومي", "ختم القرآن", "قراءة قرآن", "حفظ قرآن", "مصحف يومي"],
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = state.lastDate === today ? state.completedToday : 0;

  const persist = (next: typeof state) => {
    setState(next);
    saveDailyWirdState(next);
  };

  const update = (patch: Partial<typeof state>) => persist({ ...state, ...patch });

  const addPage = (n: number) => {
    const prev = state.lastDate === today ? state.completedToday : 0;
    const next = prev + n;
    const justDone = next >= state.pagesPerDay && prev < state.pagesPerDay;
    persist({
      ...state,
      completedToday: next,
      lastDate: today,
      monthlyTotal: state.monthlyTotal + n,
    });
    if (justDone) incrementTaskProgress("wird", 1);
  };

  const resetToday = () => update({ completedToday: 0 });

  const pct  = state.pagesPerDay > 0 ? todayCompleted / state.pagesPerDay : 0;
  const done = todayCompleted >= state.pagesPerDay && state.pagesPerDay > 0;

  return (
    <div className="page-shell narrow wird-page">
      <PageHeader
        eyebrow="القرآن"
        title="الورد اليومي"
        subtitle="تابع قراءتك اليومية وموضع الوقوف."
      />

      {/* البطاقة الرئيسية — الحلقة والأزرار */}
      <div className="wird-hero ui-card">
        <WirdRing pct={pct} pages={todayCompleted} target={state.pagesPerDay} />

        <div className="wird-count-btns" role="group" aria-label="إضافة صفحات">
          {[1, 2, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="wird-count-btn"
              onClick={() => addPage(n)}
              disabled={done}
              aria-label={`أضف ${n} ${n === 1 ? "صفحة" : "صفحات"}`}
            >
              +{toAr(n)}
            </button>
          ))}
        </div>

        {done ? (
          <p className="wird-done-msg"><Leaf size={15} strokeWidth={1.8} aria-hidden="true" /> أكملت وردك لهذا اليوم</p>
        ) : (
          <p className="wird-remaining">
            {toAr(Math.max(0, state.pagesPerDay - todayCompleted))} صفحة متبقية
          </p>
        )}

        {todayCompleted > 0 && (
          <button type="button" className="wird-reset-btn" onClick={resetToday}>
            إعادة ضبط اليوم
          </button>
        )}

        {/* إحصائيات */}
        <div className="wird-stats-row">
          <div className="wird-stat">
            <span>هذا الشهر</span>
            <strong>{toAr(state.monthlyTotal)} صفحة</strong>
          </div>
        </div>
      </div>

      {/* ضبط الورد */}
      <div className="wird-settings ui-card">
        <h2 className="wird-settings__title">ضبط الورد</h2>

        <label className="wird-field">
          <span>الهدف اليومي (صفحات)</span>
          <input
            type="number" min={1} max={30}
            value={state.pagesPerDay}
            onChange={(e) => update({ pagesPerDay: Math.max(1, Number(e.target.value)) })}
          />
        </label>

        <label className="wird-field">
          <span>السورة الحالية</span>
          <select
            value={state.currentSurah}
            onChange={(e) => update({ currentSurah: Number(e.target.value) })}
          >
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="wird-field">
          <span>رقم الآية</span>
          <input
            type="number" min={1}
            value={state.currentAyah}
            onChange={(e) => update({ currentAyah: Math.max(1, Number(e.target.value)) })}
          />
        </label>

        <Link href={`/quran?surah=${state.currentSurah}`} className="wird-quran-link">
          <BookOpen size={15} strokeWidth={1.8} aria-hidden="true" /> فتح المصحف من هذا الموضع
        </Link>
      </div>
    </div>
  );
}
