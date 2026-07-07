import { useEffect, useRef, useState } from "react";
import { getCurrentHijriInfo } from "@/lib/hijri-utils";

// ─── أنواع ───────────────────────────────────────────────────────────────────
type ReminderType = "fasting" | "prayer" | "quran" | "dhikr" | "charity" | "hajj" | "general";

type Reminder = {
  icon: string;
  label: string;
  body: string;
  type: ReminderType;
  urgent?: boolean;
};

type Period = {
  title: string;
  accent: string;
  reminders: Reminder[];
  countdown?: { days: number; label: string };
};

// ─── ألوان أنواع العبادات ──────────────────────────────────────────────────
const TYPE_COLOR: Record<ReminderType, string> = {
  fasting:  "#2563EB",
  prayer:   "#16A34A",
  quran:    "#7C3AED",
  dhikr:    "#0891B2",
  charity:  "#D97706",
  hajj:     "#92400E",
  general:  "#4B5563",
};

// ─── بيانات الفترات ───────────────────────────────────────────────────────────
function getPeriod(month: number, day: number, year: number): Period {

  if (month === 9) {
    const base: Reminder[] = [
      { icon: "🌙", label: "الصيام",     body: "صُم يومك محتسباً — الصيام جُنَّة وكفّارة.", type: "fasting", urgent: true },
      { icon: "📖", label: "القرآن",     body: "خصّص ورداً يومياً للتلاوة — رمضان شهر القرآن.", type: "quran" },
      { icon: "🕌", label: "قيام الليل", body: "من قام رمضان إيماناً واحتساباً غُفر له ما تقدّم.", type: "prayer" },
      { icon: "🤲", label: "الدعاء",     body: "للصائم دعوة لا تُردّ — أكثر منه عند الإفطار.", type: "dhikr" },
      { icon: "💝", label: "الصدقة",     body: "أجوَد ما كان النبي ﷺ في رمضان — تصدّق ولو قليلاً.", type: "charity" },
    ];
    if (day >= 21) {
      return {
        title: `العشر الأواخر — رمضان ${year}هـ`,
        accent: "#7C3AED",
        countdown: day <= 27 ? { days: 27 - day, label: "حتى ليلة ٢٧" } : undefined,
        reminders: [
          { icon: "✨", label: "ليلة القدر", body: "ابحث عن ليلة القدر في الوتر — خير من ألف شهر.", type: "general", urgent: true },
          { icon: "🕌", label: "الاعتكاف", body: "الاعتكاف في العشر الأواخر سنّة النبي ﷺ.", type: "prayer" },
          { icon: "🤲", label: "الدعاء",    body: "اللهم إنك عفو تحب العفو فاعفُ عنّا.", type: "dhikr", urgent: true },
          { icon: "📖", label: "القرآن",    body: "أتمّ ختمة القرآن قبل انتهاء رمضان المبارك.", type: "quran" },
          ...base,
        ],
      };
    }
    return { title: `رمضان المبارك ${year}هـ`, accent: "#7C3AED", reminders: base };
  }

  if (month === 12 && day <= 13) {
    if (day === 9) return {
      title: `يوم عرفة — ${day} ذو الحجة ${year}هـ`, accent: "#D97706",
      reminders: [
        { icon: "🌄", label: "يوم عرفة",   body: "صيامه يُكفّر سنتين — الماضية والقادمة لغير الحاج.", type: "fasting", urgent: true },
        { icon: "🤲", label: "الدعاء",     body: "خير الدعاء دعاء يوم عرفة — أكثر منه الآن.", type: "dhikr", urgent: true },
        { icon: "📿", label: "التكبير",    body: "اللهُ أكبر اللهُ أكبر لا إله إلا الله واللهُ أكبر.", type: "dhikr" },
      ],
    };
    if (day === 10) return {
      title: `عيد الأضحى المبارك — ${year}هـ`, accent: "#16A34A",
      reminders: [
        { icon: "🐑", label: "الأضحية",   body: "الأضحية سنّة مؤكدة — لا تُفوّت أجرها إن استطعت.", type: "general", urgent: true },
        { icon: "📿", label: "التكبير",   body: "أكثر من التكبير تعظيماً لله في يوم العيد.", type: "dhikr" },
        { icon: "💝", label: "الصدقة",    body: "أدخل الفرحة على المحتاجين في يوم العيد.", type: "charity" },
      ],
    };
    if (day >= 11 && day <= 13) return {
      title: `أيام التشريق — ذو الحجة ${year}هـ`, accent: "#16A34A",
      reminders: [
        { icon: "📿", label: "التكبير",   body: "أيام التشريق أيام أكل وشرب وذكر لله.", type: "dhikr" },
        { icon: "💝", label: "الصدقة",    body: "شارك لحم الأضحية مع المحتاجين.", type: "charity" },
        { icon: "🤲", label: "الشكر",     body: "اشكر الله على نعمة الإسلام والأمن.", type: "general" },
      ],
    };
    return {
      title: `العشر الأُوَل من ذي الحجة ${year}هـ`, accent: "#D97706",
      countdown: { days: 9 - day, label: "حتى يوم عرفة" },
      reminders: [
        { icon: "⭐", label: "أفضل الأيام", body: "ما من أيام العمل الصالح فيها أحبُّ إلى الله من هذه.", type: "general", urgent: true },
        { icon: "🌙", label: "الصيام",      body: "صيام الأيام التسع من أفضل الأعمال — لا تُفوّتها.", type: "fasting", urgent: true },
        { icon: "📿", label: "التكبير",     body: "أكثر من التكبير المطلق في هذه الأيام المباركة.", type: "dhikr" },
        { icon: "📖", label: "القرآن",      body: "اقرأ القرآن وتدبّر معانيه في أفضل الأيام.", type: "quran" },
        { icon: "💝", label: "الصدقة",      body: "الصدقة في أفضل الأيام تُضاعف الأجر.", type: "charity" },
        { icon: "🕌", label: "الصلاة",      body: "حافظ على الصلوات بطمأنينة وخشوع.", type: "prayer" },
      ],
    };
  }

  if (month === 1) {
    if (day === 10) return {
      title: `يوم عاشوراء — ${year}هـ`, accent: "#1D4ED8",
      reminders: [
        { icon: "🌙", label: "عاشوراء",    body: "صيام عاشوراء يُكفّر السنة الماضية — لا تُفوّته.", type: "fasting", urgent: true },
        { icon: "🤲", label: "الدعاء",     body: "أكثر من الدعاء والاستغفار في هذا اليوم المبارك.", type: "dhikr" },
        { icon: "💝", label: "الصدقة",     body: "التوسعة على الأهل يوم عاشوراء من السنة.", type: "charity" },
      ],
    };
    if (day < 10) return {
      title: `شهر محرَّم ${year}هـ`, accent: "#1D4ED8",
      countdown: { days: 10 - day, label: "حتى عاشوراء" },
      reminders: [
        { icon: "🌙", label: "الصيام",      body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم.", type: "fasting" },
        { icon: "⏳", label: "استعداد",     body: `تبقّى ${10 - day} أيام على عاشوراء — استعدّ لصيامها.`, type: "fasting", urgent: true },
        { icon: "🤲", label: "الاستغفار",   body: "أكثر من الاستغفار في أول السنة الهجرية الجديدة.", type: "dhikr" },
      ],
    };
    return {
      title: `شهر محرَّم ${year}هـ`, accent: "#1D4ED8",
      reminders: [
        { icon: "🌙", label: "الصيام",      body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم.", type: "fasting" },
        { icon: "🤲", label: "الاستغفار",   body: "أكثر من الاستغفار — فالتوبة في بداية السنة بركة.", type: "dhikr" },
        { icon: "📖", label: "القرآن",      body: "اجعل لك ورداً يومياً من القرآن لا تُخلّ به.", type: "quran" },
      ],
    };
  }

  if (month === 7) return {
    title: `رَجَب الأصمّ ${year}هـ — شهر حرام`, accent: "#0E6E52",
    reminders: [
      { icon: "🌙", label: "الصيام",      body: "رجب من الأشهر الحُرُم — أكثر من صيام النوافل.", type: "fasting" },
      { icon: "🤲", label: "الاستغفار",   body: "اللهم بارك لنا في رجب وشعبان وبلّغنا رمضان.", type: "dhikr" },
      { icon: "📖", label: "القرآن",      body: "رجب بوابة رمضان — ابدأ مراجعة القرآن الآن.", type: "quran" },
      { icon: "💝", label: "الصدقة",      body: "الصدقة في الأشهر الحرم أعظم أجراً.", type: "charity" },
    ],
  };

  if (month === 8) {
    const daysToRamadan = 30 - day;
    return {
      title: `شَعبان ${year}هـ — استعداد لرمضان`, accent: "#6D28D9",
      countdown: daysToRamadan > 0 ? { days: daysToRamadan, label: "حتى رمضان" } : undefined,
      reminders: [
        { icon: "📖", label: "القرآن",     body: "أتمم ختم القرآن قبل رمضان — فرمضان قريب.", type: "quran", urgent: true },
        { icon: "🌙", label: "الصيام",     body: "كان النبي ﷺ يكثر الصيام في شعبان — اقتدِ به.", type: "fasting" },
        { icon: "🤲", label: "الدعاء",     body: "اللهم بلّغنا رمضان وأعنّا على صيامه وقيامه.", type: "dhikr" },
        { icon: "🕌", label: "القيام",     body: "استعدّ للتراويح — عوّد نفسك على القيام الآن.", type: "prayer" },
      ],
    };
  }

  if (month === 10 && day <= 6) return {
    title: `ست شوال ${year}هـ — لا تُفوّتها`, accent: "#16A34A",
    countdown: { days: 6 - day, label: "حتى تنتهي الفرصة" },
    reminders: [
      { icon: "🌙", label: "ست شوال",    body: "من صام رمضان وأتبعه ستاً من شوال كصيام الدهر.", type: "fasting", urgent: true },
      { icon: "🤲", label: "شكر الله",   body: "اشكر الله على إتمام رمضان — دم على الطاعة.", type: "dhikr" },
      { icon: "💝", label: "الصدقة",     body: "لا تنقطع عن الصدقة بعد رمضان — فالمؤمن لا موسم له.", type: "charity" },
    ],
  };

  if (month === 11) return {
    title: `ذو القَعدة ${year}هـ — شهر حرام`, accent: "#92400E",
    reminders: [
      { icon: "🕋", label: "استعداد للحج", body: "ذو القعدة من أشهر الحج — تهيّأ للحج أو العمرة.", type: "hajj" },
      { icon: "🌙", label: "الصيام",       body: "الأشهر الحرم من أفضل أوقات صيام النوافل.", type: "fasting" },
      { icon: "🤲", label: "الذكر",        body: "أكثر من الاستغفار والتسبيح في الشهر الحرام.", type: "dhikr" },
    ],
  };

  // بقية الأشهر
  const DAILY: Reminder[] = [
    { icon: "🕌", label: "الصلاة",      body: "حافظ على الصلوات في أوقاتها مع الجماعة — فهي عمود الدين.", type: "prayer" },
    { icon: "📿", label: "الأذكار",     body: "لا تُهمل أذكار الصباح والمساء — هي حصنك اليومي.", type: "dhikr" },
    { icon: "📖", label: "القرآن",      body: "اجعل لك حزباً يومياً من القرآن لا تُخلّ به.", type: "quran" },
    { icon: "🌙", label: "الصيام",      body: "صم الاثنين والخميس — سنّة النبي ﷺ، وفيهما تُعرض الأعمال.", type: "fasting" },
    { icon: "💝", label: "الصدقة",      body: "الصدقة تدفع البلاء وتُطفئ الخطيئة — تصدّق ولو بالقليل.", type: "charity" },
    { icon: "🤝", label: "صلة الرحم",   body: "صل رحمك اليوم — فبرّ الوالدين من أعظم القُرُبات.", type: "general" },
    { icon: "🤲", label: "الاستغفار",   body: "أكثر من الاستغفار — فللمستغفرين من الله رزق وفرج.", type: "dhikr" },
    { icon: "🕌", label: "السنن",       body: "حافظ على سنن الصلاة الراتبة — فهي ذخر في الآخرة.", type: "prayer" },
    { icon: "📖", label: "العلم الشرعي", body: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريق الجنة.", type: "general" },
    { icon: "💝", label: "إطعام الطعام", body: "أطعم جارك أو المحتاج — من خير الأعمال.", type: "charity" },
  ];

  const MONTH_NAMES: Record<number, string> = {
    2: "صَفَر", 3: "ربيع الأول", 4: "ربيع الآخر",
    5: "جُمادى الأولى", 6: "جُمادى الآخرة", 10: "شَوَّال",
  };

  const start = (month % 5) * 2;
  const slice = DAILY.slice(start, start + 5);
  return {
    title: `${MONTH_NAMES[month] ?? "هذا الشهر"} ${year}هـ`,
    accent: "#18362A",
    reminders: slice.length >= 3 ? slice : DAILY.slice(0, 5),
  };
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────
export function HijriSacredMonthBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex]         = useState(0);
  const [visible, setVisible]     = useState(true); // للحركة

  const info    = getCurrentHijriInfo();
  const period  = info ? getPeriod(info.month, info.day, info.year) : null;
  const reminders = period?.reminders ?? [];

  // دوران تلقائي كل 7 ثوانٍ
  useEffect(() => {
    if (reminders.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % reminders.length);
        setVisible(true);
      }, 280);
    }, 7000);
    return () => clearInterval(id);
  }, [reminders.length]);

  if (!info || !period || dismissed) return null;

  const current = reminders[index % reminders.length];
  const accent  = period.accent;
  const typeColor = TYPE_COLOR[current.type];

  return (
    <div
      role="complementary"
      aria-label="تذكير إسلامي"
      style={{
        direction: "rtl",
        margin: "0.75rem 1rem 0",
        borderRadius: "0.9rem",
        border: `1.5px solid ${accent}22`,
        borderRight: `4px solid ${accent}`,
        background: `linear-gradient(135deg, ${accent}10 0%, ${accent}05 60%, transparent 100%)`,
        boxShadow: `0 2px 12px ${accent}12, 0 1px 3px rgba(0,0,0,0.06)`,
        padding: "0.75rem 0.9rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── الصف الأول: العنوان + الشارات ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
        {/* اسم الفترة */}
        <span style={{
          fontWeight: 800,
          fontSize: "0.76rem",
          color: accent,
          letterSpacing: "0.01em",
          flexShrink: 0,
        }}>
          {period.title}
        </span>

        {/* شارة نوع العبادة */}
        <span style={{
          fontSize: "0.67rem",
          fontWeight: 700,
          color: typeColor,
          background: `${typeColor}14`,
          border: `1px solid ${typeColor}35`,
          borderRadius: "99px",
          padding: "0.06rem 0.55rem",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {current.label}
        </span>

        {/* عداد تنازلي للحدث القادم */}
        {period.countdown && period.countdown.days >= 0 && (
          <span style={{
            fontSize: "0.67rem",
            fontWeight: 700,
            color: "#fff",
            background: accent,
            borderRadius: "99px",
            padding: "0.06rem 0.6rem",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {period.countdown.days === 0 ? period.countdown.label : `${period.countdown.days} يوم ${period.countdown.label}`}
          </span>
        )}

        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق التذكير"
          style={{
            marginInlineStart: "auto",
            background: "none",
            border: "none",
            color: "var(--majalis-ink-muted, #9BA3B5)",
            fontSize: "1rem",
            lineHeight: 1,
            cursor: "pointer",
            padding: "0.1rem 0.3rem",
            flexShrink: 0,
            borderRadius: "4px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--majalis-ink)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--majalis-ink-muted)"; }}
        >
          ×
        </button>
      </div>

      {/* ── نص التذكير مع حركة fade ── */}
      <div
        key={index}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.55rem",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        <span style={{
          fontSize: "1.1rem",
          flexShrink: 0,
          lineHeight: 1.2,
          marginTop: "0.05rem",
        }}>
          {current.icon}
        </span>
        <p style={{
          margin: 0,
          fontSize: "0.83rem",
          color: "var(--majalis-ink-soft, #C5C0BA)",
          lineHeight: 1.6,
          fontWeight: current.urgent ? 600 : 400,
        }}>
          {current.body}
        </p>
      </div>

      {/* ── نقاط الترقيم (dots) ── */}
      {reminders.length > 1 && (
        <div style={{
          display: "flex",
          gap: "0.3rem",
          marginTop: "0.1rem",
          alignItems: "center",
        }}>
          {reminders.map((_, i) => {
            const active = i === index % reminders.length;
            return (
              <button
                key={i}
                type="button"
                aria-label={`تذكير ${i + 1}`}
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => { setIndex(i); setVisible(true); }, 280);
                }}
                style={{
                  width: active ? 18 : 6,
                  height: 5,
                  borderRadius: "99px",
                  border: "none",
                  background: active ? accent : `${accent}40`,
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.35s ease, background 0.25s ease",
                  flexShrink: 0,
                }}
              />
            );
          })}
          <span style={{
            marginInlineStart: "auto",
            fontSize: "0.62rem",
            color: `${accent}80`,
            fontWeight: 500,
          }}>
            {index + 1}/{reminders.length}
          </span>
        </div>
      )}
    </div>
  );
}
