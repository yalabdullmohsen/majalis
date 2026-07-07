import { useEffect, useState } from "react";
import { getCurrentHijriInfo } from "@/lib/hijri-utils";

// ─── أنواع ───────────────────────────────────────────────────────────────────
type ReminderType = "fasting" | "prayer" | "quran" | "dhikr" | "charity" | "hajj" | "general";

type Reminder = {
  icon: string;
  label: string;    // نوع العبادة
  body: string;     // نص التذكير
  type: ReminderType;
  urgent?: boolean;
};

type Period = {
  title: string;
  accent: string;    // لون مميز
  reminders: Reminder[];
  countdown?: { days: number; label: string }; // عداد تنازلي
};

// ─── حساب الفترة حسب الشهر واليوم ─────────────────────────────────────────
function getPeriod(month: number, day: number, year: number): Period {

  // ── رمضان ─────────────────────────────────
  if (month === 9) {
    const base: Reminder[] = [
      { icon: "🌙", label: "الصيام", body: "صُم يومك محتسباً — فالصيام جُنَّة وكفّارة.", type: "fasting", urgent: true },
      { icon: "📖", label: "القرآن", body: "خصّص وقتاً لتلاوة القرآن اليوم — رمضان شهر القرآن.", type: "quran" },
      { icon: "🕌", label: "قيام الليل", body: "من قام رمضان إيماناً واحتساباً غُفر له ما تقدّم من ذنبه.", type: "prayer" },
      { icon: "🤲", label: "الدعاء", body: "للصائم دعوة لا تُردّ — أكثر من الدعاء عند الإفطار.", type: "dhikr" },
      { icon: "💝", label: "الصدقة", body: "أجوَد ما كان النبي ﷺ في رمضان — تصدّق ولو بالقليل.", type: "charity" },
    ];
    if (day >= 21) {
      return {
        title: `العشر الأواخر — رمضان ${year}هـ`,
        accent: "#7C3AED",
        countdown: day <= 27 ? { days: 27 - day, label: "حتى ليلة ٢٧" } : undefined,
        reminders: [
          { icon: "✨", label: "ليلة القدر", body: "ابحث عن ليلة القدر في الوتر — هي خير من ألف شهر.", type: "general", urgent: true },
          { icon: "🕌", label: "الاعتكاف", body: "الاعتكاف في العشر الأواخر سنّة النبي ﷺ — انتهز الفرصة.", type: "prayer" },
          { icon: "🤲", label: "الدعاء", body: "اللهم إنك عفو تحب العفو فاعفُ عنّا — ردّده في هذه الليالي.", type: "dhikr", urgent: true },
          { icon: "📖", label: "القرآن", body: "أتمّ ختمة القرآن قبل انتهاء رمضان المبارك.", type: "quran" },
          ...base,
        ],
      };
    }
    return { title: `رمضان المبارك ${year}هـ`, accent: "#7C3AED", reminders: base };
  }

  // ── عشر ذي الحجة ──────────────────────────
  if (month === 12 && day <= 13) {
    if (day === 9) {
      return {
        title: `يوم عرفة — ${day} ذو الحجة ${year}هـ`,
        accent: "#D97706",
        reminders: [
          { icon: "🌄", label: "يوم عرفة", body: "صيام يوم عرفة يُكفّر سنتين — الماضية والقادمة (لغير الحاج).", type: "fasting", urgent: true },
          { icon: "🤲", label: "الدعاء", body: "خير الدعاء دعاء يوم عرفة — أكثر من الدعاء والذكر الآن.", type: "dhikr", urgent: true },
          { icon: "📿", label: "التكبير", body: "اللهُ أكبر، اللهُ أكبر، لا إله إلا الله، واللهُ أكبر، اللهُ أكبر وللهِ الحمد.", type: "dhikr" },
        ],
      };
    }
    if (day === 10) {
      return {
        title: `عيد الأضحى المبارك — ${year}هـ`,
        accent: "#059669",
        reminders: [
          { icon: "🐑", label: "الأضحية", body: "الأضحية سنّة مؤكدة — لا تُفوّت أجرها إن استطعت.", type: "general", urgent: true },
          { icon: "📿", label: "التكبير", body: "أكثر من التكبير في هذا اليوم المبارك تعظيماً لله.", type: "dhikr" },
          { icon: "💝", label: "الصدقة", body: "أدخل الفرحة على قلوب المحتاجين في يوم العيد.", type: "charity" },
        ],
      };
    }
    if (day >= 11 && day <= 13) {
      return {
        title: `أيام التشريق — ذو الحجة ${year}هـ`,
        accent: "#059669",
        reminders: [
          { icon: "📿", label: "التكبير", body: "أيام التشريق أيام أكل وشرب وذكر لله — أكثر من التكبير.", type: "dhikr" },
          { icon: "💝", label: "الصدقة", body: "شارك لحم الأضحية مع المحتاجين في هذه الأيام المباركة.", type: "charity" },
          { icon: "🤲", label: "الشكر", body: "اشكر الله على نعمة الإسلام والبدن السليم والأمن.", type: "general" },
        ],
      };
    }
    // أيام 1-8
    const daysToArafah = 9 - day;
    return {
      title: `العشر الأُوَل من ذي الحجة ${year}هـ`,
      accent: "#D97706",
      countdown: { days: daysToArafah, label: "حتى يوم عرفة" },
      reminders: [
        { icon: "⭐", label: "أفضل الأيام", body: "ما من أيام العمل الصالح فيها أحبُّ إلى الله من هذه الأيام العشر.", type: "general", urgent: true },
        { icon: "🌙", label: "الصيام", body: "صيام الأيام التسع من ذي الحجة من أفضل الأعمال — لا تُفوّتها.", type: "fasting", urgent: true },
        { icon: "📿", label: "التكبير", body: "اللهُ أكبر، اللهُ أكبر، لا إله إلا الله — أكثر من التكبير المطلق.", type: "dhikr" },
        { icon: "📖", label: "القرآن", body: "اقرأ القرآن في هذه الأيام المباركة وتدبّر معانيه.", type: "quran" },
        { icon: "💝", label: "الصدقة", body: "الصدقة في أفضل الأيام تُضاعف الأجر — لا تُحقّر شيئاً.", type: "charity" },
        { icon: "🕌", label: "الصلاة", body: "حافظ على الصلوات في أوقاتها وأتِها بطمأنينة وخشوع.", type: "prayer" },
      ],
    };
  }

  // ── عاشوراء — محرم ────────────────────────
  if (month === 1) {
    if (day === 10) {
      return {
        title: `يوم عاشوراء — ${year}هـ`,
        accent: "#1D4ED8",
        reminders: [
          { icon: "🌙", label: "عاشوراء", body: "صيام عاشوراء يُكفّر السنة الماضية — لا تُفوّت هذا اليوم.", type: "fasting", urgent: true },
          { icon: "🤲", label: "الدعاء", body: "أكثر من الدعاء والاستغفار في هذا اليوم المبارك.", type: "dhikr" },
          { icon: "💝", label: "الصدقة", body: "التوسعة على الأهل يوم عاشوراء من السنة — أدخل الفرحة.", type: "charity" },
        ],
      };
    }
    if (day < 10) {
      return {
        title: `شهر محرَّم ${year}هـ`,
        accent: "#1D4ED8",
        countdown: { days: 10 - day, label: "حتى عاشوراء" },
        reminders: [
          { icon: "🌙", label: "الصيام", body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم — استثمر الأيام.", type: "fasting" },
          { icon: "⏳", label: "عاشوراء قادمة", body: `تبقّى ${10 - day} أيام على عاشوراء — استعدّ لصيامها.`, type: "fasting", urgent: true },
          { icon: "🤲", label: "الاستغفار", body: "أكثر من الاستغفار في أول السنة الهجرية الجديدة.", type: "dhikr" },
        ],
      };
    }
    return {
      title: `شهر محرَّم ${year}هـ`,
      accent: "#1D4ED8",
      reminders: [
        { icon: "🌙", label: "الصيام", body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم.", type: "fasting" },
        { icon: "🤲", label: "الاستغفار", body: "أكثر من الاستغفار — فالتوبة في بداية العام هجرية بركة.", type: "dhikr" },
        { icon: "📖", label: "القرآن", body: "اجعل لك ورداً يومياً من القرآن لا تُخلّ به.", type: "quran" },
      ],
    };
  }

  // ── رجب ──────────────────────────────────
  if (month === 7) {
    return {
      title: `رَجَب الأصمّ ${year}هـ — شهر حرام`,
      accent: "#0E6E52",
      reminders: [
        { icon: "🌙", label: "الصيام", body: "رجب من الأشهر الحُرُم — أكثر من صيام النوافل.", type: "fasting" },
        { icon: "🤲", label: "الاستغفار", body: "اللهم بارك لنا في رجب وشعبان وبلّغنا رمضان.", type: "dhikr" },
        { icon: "📖", label: "القرآن", body: "رجب بوابة رمضان — ابدأ مراجعة القرآن الآن.", type: "quran" },
        { icon: "💝", label: "الصدقة", body: "تصدّق في الأشهر الحرم — فالعمل الصالح فيها أعظم أجراً.", type: "charity" },
      ],
    };
  }

  // ── شعبان ────────────────────────────────
  if (month === 8) {
    const daysToRamadan = 30 - day; // تقريبي
    return {
      title: `شَعبان ${year}هـ — استعداد لرمضان`,
      accent: "#6D28D9",
      countdown: daysToRamadan > 0 ? { days: daysToRamadan, label: "حتى رمضان" } : undefined,
      reminders: [
        { icon: "📖", label: "القرآن", body: "أتمم ختم القرآن قبل رمضان أو راجع ما تيسّر — فرمضان قريب.", type: "quran", urgent: true },
        { icon: "🌙", label: "الصيام", body: "كان النبي ﷺ يكثر الصيام في شعبان — اقتدِ بسنته.", type: "fasting" },
        { icon: "🤲", label: "الدعاء", body: "اللهم بلّغنا رمضان وأعنّا على صيامه وقيامه.", type: "dhikr" },
        { icon: "🕌", label: "القيام", body: "استعدّ للتراويح — عوّد نفسك على القيام الآن.", type: "prayer" },
      ],
    };
  }

  // ── شوال — الست ──────────────────────────
  if (month === 10 && day <= 6) {
    return {
      title: `ست شوال ${year}هـ — لا تُفوّتها`,
      accent: "#059669",
      countdown: { days: 6 - day, label: "حتى تنتهي الفرصة" },
      reminders: [
        { icon: "🌙", label: "الست من شوال", body: "من صام رمضان ثم أتبعه ستاً من شوال كان كصيام الدهر.", type: "fasting", urgent: true },
        { icon: "🤲", label: "شكر الله", body: "اشكر الله على إتمام رمضان وتقبّله — دم على الطاعة.", type: "dhikr" },
        { icon: "💝", label: "الصدقة", body: "لا تنقطع عن الصدقة بعد رمضان — فالمؤمن لا موسم له.", type: "charity" },
      ],
    };
  }

  // ── ذو القعدة — شهر حرام ────────────────
  if (month === 11) {
    return {
      title: `ذو القَعدة ${year}هـ — شهر حرام`,
      accent: "#B45309",
      reminders: [
        { icon: "🕋", label: "الاستعداد للحج", body: "ذو القعدة من أشهر الحج — تهيّأ للعمرة أو الحج إن استطعت.", type: "hajj" },
        { icon: "🌙", label: "الصيام", body: "الأشهر الحرم من أفضل أوقات صيام النوافل — لا تُهمله.", type: "fasting" },
        { icon: "🤲", label: "الذكر", body: "أكثر من الاستغفار والتسبيح في الشهر الحرام.", type: "dhikr" },
        { icon: "📖", label: "القرآن", body: "خصّص ورداً يومياً من القرآن لا تحيد عنه.", type: "quran" },
      ],
    };
  }

  // ── بقية الأشهر — تذكيرات دورية ─────────
  const DAILY: Reminder[] = [
    { icon: "🕌", label: "الصلاة", body: "حافظ على الصلوات في أوقاتها مع الجماعة — فهي عمود الدين.", type: "prayer" },
    { icon: "📿", label: "الأذكار", body: "لا تُهمل أذكار الصباح والمساء — هي حصنك اليومي.", type: "dhikr" },
    { icon: "📖", label: "القرآن", body: "اجعل لك حزباً يومياً من القرآن لا تُخلّ به.", type: "quran" },
    { icon: "🌙", label: "الصيام", body: "صم الاثنين والخميس — سنّة النبي ﷺ، وفيهما تُعرض الأعمال.", type: "fasting" },
    { icon: "💝", label: "الصدقة", body: "الصدقة تدفع البلاء وتُطفئ الخطيئة — تصدّق ولو بالقليل.", type: "charity" },
    { icon: "🤝", label: "صلة الرحم", body: "صل رحمك اليوم — فبرّ الوالدين وصلة الرحم من أعظم القُرُبات.", type: "general" },
    { icon: "🤲", label: "الاستغفار", body: "أكثر من الاستغفار — فللمستغفرين من الله رزق وفرج.", type: "dhikr" },
    { icon: "🕌", label: "سنن الصلاة", body: "حافظ على سنن الصلاة الراتبة — فهي خير موروث وذخر في الآخرة.", type: "prayer" },
    { icon: "📖", label: "العلم", body: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريق الجنة.", type: "general" },
    { icon: "💝", label: "إطعام الطعام", body: "أطعم جارك أو المحتاج — فإطعام الطعام من خير الأعمال.", type: "charity" },
  ];

  // اختر مجموعة مناسبة للشهر
  const monthReminders = DAILY.slice((month % 3) * 3, (month % 3) * 3 + 5) || DAILY.slice(0, 5);
  const MONTH_NAMES: Record<number, string> = {
    2: "صَفَر", 3: "ربيع الأول", 4: "ربيع الآخر",
    5: "جُمادى الأولى", 6: "جُمادى الآخرة", 10: "شَوَّال",
  };

  return {
    title: `${MONTH_NAMES[month] ?? "هذا الشهر"} ${year}هـ`,
    accent: "#18362A",
    reminders: monthReminders.length ? monthReminders : DAILY.slice(0, 5),
  };
}

// ─── ألوان أنواع العبادات ─────────────────────────────────────────────────
const TYPE_COLOR: Record<ReminderType, string> = {
  fasting:  "#1D4ED8",
  prayer:   "#18362A",
  quran:    "#7C3AED",
  dhikr:    "#059669",
  charity:  "#D97706",
  hajj:     "#B45309",
  general:  "#374151",
};

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────
export function HijriSacredMonthBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex]         = useState(0);

  const info = getCurrentHijriInfo();
  // نحسب الفترة مبكراً (قبل أي return) لإبقاء الـ hooks ثابتة
  const period = info ? getPeriod(info.month, info.day, info.year) : null;
  const reminders = period?.reminders ?? [];

  // دوران تلقائي كل 6 ثوان — Hook يجب أن يكون قبل أي return مشروط
  useEffect(() => {
    if (reminders.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % reminders.length), 6000);
    return () => clearInterval(id);
  }, [reminders.length]);

  if (!info || !period || dismissed) return null;

  const current = reminders[index % reminders.length];
  const accent = period.accent;

  return (
    <div
      role="banner"
      style={{
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
        borderBottom: `1px solid ${accent}30`,
        borderRight: `4px solid ${accent}`,
        direction: "rtl",
        padding: "0.6rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── أيقونة + المحتوى ── */}
      <span style={{ fontSize: "1.15rem", flexShrink: 0, lineHeight: 1, filter: "drop-shadow(0 0 4px rgba(0,0,0,.3))" }}>
        {current.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* عنوان الفترة + نوع العبادة */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.1rem" }}>
          <span style={{ fontWeight: 800, fontSize: "0.78rem", color: accent, whiteSpace: "nowrap" }}>
            {period.title}
          </span>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700,
            color: TYPE_COLOR[current.type],
            background: `${TYPE_COLOR[current.type]}18`,
            border: `1px solid ${TYPE_COLOR[current.type]}40`,
            borderRadius: "999px", padding: "0.05rem 0.45rem",
            whiteSpace: "nowrap",
          }}>
            {current.label}
          </span>
          {period.countdown && (
            <span style={{
              fontSize: "0.68rem", fontWeight: 700,
              color: "#fff", background: accent,
              borderRadius: "999px", padding: "0.05rem 0.5rem",
              whiteSpace: "nowrap",
            }}>
              {period.countdown.days > 0 ? `${period.countdown.days} يوم ${period.countdown.label}` : period.countdown.label}
            </span>
          )}
        </div>

        {/* نص التذكير */}
        <p style={{
          margin: 0,
          fontSize: "0.8rem",
          color: "var(--majalis-ink-soft, #C9C5B8)",
          lineHeight: 1.5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "55ch",
        }}>
          {current.body}
        </p>
      </div>

      {/* ── نقاط الصفحة ── */}
      {reminders.length > 1 && (
        <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0, alignItems: "center" }}>
          {reminders.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`تذكير ${i + 1}`}
              onClick={() => setIndex(i)}
              style={{
                width: i === index % reminders.length ? 16 : 6,
                height: 6,
                borderRadius: "999px",
                border: "none",
                background: i === index % reminders.length ? accent : `${accent}50`,
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s ease, background 0.3s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* ── زر الإغلاق ── */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إغلاق"
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          color: "var(--majalis-ink-muted, #9BA3B5)",
          fontSize: "0.85rem",
          cursor: "pointer",
          padding: "0.1rem 0.4rem",
          lineHeight: 1.4,
          flexShrink: 0,
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "var(--majalis-ink)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "var(--majalis-ink-muted)"; }}
      >
        ×
      </button>
    </div>
  );
}
