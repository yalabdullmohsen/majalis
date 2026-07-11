import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════
   HomeSawmReminder، يظهر في الصفحة الرئيسية كل اثنين وخميس
   ══════════════════════════════════════════════════════════════════ */

const HADITHS = [
  {
    text: "«تُعرَض الأعمال يوم الاثنين والخميس، فأحب أن يُعرَض عملي وأنا صائم»",
    source: "الترمذي: ٧٤٧، صحيح",
  },
  {
    text: "«تُفتَح أبواب الجنة يوم الاثنين ويوم الخميس، فيُغفَر لكل عبد لا يُشرِك بالله شيئاً»",
    source: "مسلم: ٢٥٦٥",
  },
  {
    text: "«كان النبي ﷺ يتحرَّى صيام الاثنين والخميس»",
    source: "الترمذي: ٧٤٥، صحيح",
  },
  {
    text: "«ذاك يوم وُلِدتُ فيه، ويوم بُعِثتُ فيه، أو أُنزِل علَيَّ فيه»، عن سبب صيام الاثنين",
    source: "مسلم: ١١٦٢",
  },
];

const DISMISS_KEY = "sawm-reminder-dismissed";

function getTodayName(): { isFastDay: boolean; dayName: string } {
  const day = new Date().getDay(); // 0=Sun 1=Mon ... 4=Thu
  if (day === 1) return { isFastDay: true, dayName: "الاثنين" };
  if (day === 4) return { isFastDay: true, dayName: "الخميس" };
  return { isFastDay: false, dayName: "" };
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function HomeSawmReminder() {
  const [visible, setVisible] = useState(false);
  const [hadithIdx, setHadithIdx] = useState(0);
  const { isFastDay, dayName } = getTodayName();

  useEffect(() => {
    if (!isFastDay) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed !== getTodayKey()) setVisible(true);
    // rotate hadith by day-of-year
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setHadithIdx(doy % HADITHS.length);
  }, [isFastDay]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, getTodayKey());
    setVisible(false);
  }

  if (!visible) return null;

  const h = HADITHS[hadithIdx];

  return (
    <div className="sawm-reminder" dir="rtl" role="region" aria-label="تذكير صيام النافلة">
      <div className="sawm-reminder__header">
        <span className="sawm-reminder__icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M14.5 10.5a6.5 6.5 0 1 1-7-7 5.5 5.5 0 0 0 7 7z"/>
          </svg>
        </span>
        <span className="sawm-reminder__day">اليوم {dayName}</span>
        <span className="sawm-reminder__sub">— يوم صيام سنة</span>
        <button
          type="button"
          className="sawm-reminder__close"
          onClick={dismiss}
          aria-label="إغلاق التذكير"
        >✕</button>
      </div>
      <blockquote className="sawm-reminder__hadith">{h.text}</blockquote>
      <p className="sawm-reminder__source">{h.source}</p>
      <p className="sawm-reminder__dua">
        نية الصيام: <em>«نويت صيام يوم {dayName} سنةً لله تعالى»</em>
      </p>
    </div>
  );
}
