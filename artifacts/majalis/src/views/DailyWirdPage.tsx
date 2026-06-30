import { useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  getDailyWirdState,
  getSurahList,
  saveDailyWirdState,
} from "@/lib/quran-api";
import { incrementTaskProgress } from "@/lib/daily-progress";

export default function DailyWirdPage() {
  const [state, setState] = useState(getDailyWirdState());
  const surahs = getSurahList();

  const update = (patch: Partial<typeof state>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveDailyWirdState(next);
  };

  const completeToday = () => {
    update({ completedToday: state.pagesPerDay, lastDate: new Date().toISOString().slice(0, 10) });
    incrementTaskProgress("wird", 1);
  };

  const percent =
    state.pagesPerDay > 0
      ? Math.min(100, Math.round((state.completedToday / state.pagesPerDay) * 100))
      : 0;

  return (
    <div className="page-shell narrow">
      <PageHeader
        eyebrow="القرآن"
        title="الورد اليومي"
        subtitle="تابع قراءتك اليومية وموضع الوقوف."
      />

      <div className="wird-card ui-card">
        <label>
          مقدار الورد (صفحات)
          <input
            type="number"
            min={1}
            max={30}
            value={state.pagesPerDay}
            onChange={(e) => update({ pagesPerDay: Number(e.target.value) || 1 })}
          />
        </label>

        <label>
          السورة الحالية
          <select
            value={state.currentSurah}
            onChange={(e) => update({ currentSurah: Number(e.target.value) })}
          >
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          الآية
          <input
            type="number"
            min={1}
            value={state.currentAyah}
            onChange={(e) => update({ currentAyah: Number(e.target.value) || 1 })}
          />
        </label>

        <div className="home-progress-card__bar" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p>{state.completedToday} من {state.pagesPerDay} · {percent}%</p>
        <p>إنجاز الشهر: {state.monthlyTotal}</p>

        <div className="wird-actions">
          <button type="button" className="ui-card-btn" onClick={completeToday}>
            إكمال اليوم
          </button>
          <Link href={`/quran?surah=${state.currentSurah}`} className="ui-card-btn">
            متابعة القراءة
          </Link>
        </div>
      </div>
    </div>
  );
}
