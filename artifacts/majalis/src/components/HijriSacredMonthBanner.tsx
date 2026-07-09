import { useEffect, useState } from "react";
import { BookOpen, Building2, Heart, Moon, RotateCw, Star, Sunset, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentHijriInfo } from "@/lib/hijri-utils";

// ─── أنواع ───────────────────────────────────────────────────────────────────
type ReminderType = "fasting" | "prayer" | "quran" | "dhikr" | "charity" | "hajj" | "general";

type Reminder = {
  Icon: LucideIcon;
  label: string;
  body: string;
  type: ReminderType;
  urgent?: boolean;
};

type Period = {
  title: string;
  kind: string;
  reminders: Reminder[];
  countdown?: { days: number; label: string };
};

// ─── بيانات الفترات ───────────────────────────────────────────────────────────
function getPeriod(month: number, day: number, year: number): Period {

  if (month === 9) {
    const base: Reminder[] = [
      { Icon: Moon,    label: "الصيام",     body: "صُم يومك محتسباً — الصيام جُنَّة وكفّارة.", type: "fasting", urgent: true },
      { Icon: BookOpen, label: "القرآن",    body: "خصّص ورداً يومياً للتلاوة — رمضان شهر القرآن.", type: "quran" },
      { Icon: Sunset,  label: "قيام الليل", body: "من قام رمضان إيماناً واحتساباً غُفر له ما تقدّم.", type: "prayer" },
      { Icon: RotateCw, label: "الدعاء",   body: "للصائم دعوة لا تُردّ — أكثر منه عند الإفطار.", type: "dhikr" },
      { Icon: Heart,   label: "الصدقة",    body: "أجوَد ما كان النبي ﷺ في رمضان — تصدّق ولو قليلاً.", type: "charity" },
    ];
    if (day >= 21) {
      return {
        title: `العشر الأواخر — رمضان ${year}هـ`,
        kind: "ramadan",
        countdown: day <= 27 ? { days: 27 - day, label: "حتى ليلة ٢٧" } : undefined,
        reminders: [
          { Icon: Star,    label: "ليلة القدر", body: "ابحث عن ليلة القدر في الوتر — خير من ألف شهر.", type: "general", urgent: true },
          { Icon: Sunset,  label: "الاعتكاف",  body: "الاعتكاف في العشر الأواخر سنّة النبي ﷺ.", type: "prayer" },
          { Icon: RotateCw, label: "الدعاء",   body: "اللهم إنك عفو تحب العفو فاعفُ عنّا.", type: "dhikr", urgent: true },
          { Icon: BookOpen, label: "القرآن",   body: "أتمّ ختمة القرآن قبل انتهاء رمضان المبارك.", type: "quran" },
          ...base,
        ],
      };
    }
    return { title: `رمضان المبارك ${year}هـ`, kind: "ramadan", reminders: base };
  }

  if (month === 12 && day <= 13) {
    if (day === 9) return {
      title: `يوم عرفة — ${day} ذو الحجة ${year}هـ`, kind: "emerald",
      reminders: [
        { Icon: Moon,    label: "يوم عرفة", body: "صيامه يُكفّر سنتين — الماضية والقادمة لغير الحاج.", type: "fasting", urgent: true },
        { Icon: RotateCw, label: "الدعاء",  body: "خير الدعاء دعاء يوم عرفة — أكثر منه الآن.", type: "dhikr", urgent: true },
        { Icon: RotateCw, label: "التكبير", body: "اللهُ أكبر اللهُ أكبر لا إله إلا الله واللهُ أكبر.", type: "dhikr" },
      ],
    };
    if (day === 10) return {
      title: `عيد الأضحى المبارك — ${year}هـ`, kind: "emerald",
      reminders: [
        { Icon: Star,    label: "الأضحية", body: "الأضحية سنّة مؤكدة — لا تُفوّت أجرها إن استطعت.", type: "general", urgent: true },
        { Icon: RotateCw, label: "التكبير", body: "أكثر من التكبير تعظيماً لله في يوم العيد.", type: "dhikr" },
        { Icon: Heart,   label: "الصدقة",  body: "أدخل الفرحة على المحتاجين في يوم العيد.", type: "charity" },
      ],
    };
    if (day >= 11 && day <= 13) return {
      title: `أيام التشريق — ذو الحجة ${year}هـ`, kind: "emerald",
      reminders: [
        { Icon: RotateCw, label: "التكبير", body: "أيام التشريق أيام أكل وشرب وذكر لله.", type: "dhikr" },
        { Icon: Heart,   label: "الصدقة",  body: "شارك لحم الأضحية مع المحتاجين.", type: "charity" },
        { Icon: RotateCw, label: "الشكر",  body: "اشكر الله على نعمة الإسلام والأمن.", type: "general" },
      ],
    };
    return {
      title: `العشر الأُوَل من ذي الحجة ${year}هـ`, kind: "emerald",
      countdown: { days: 9 - day, label: "حتى يوم عرفة" },
      reminders: [
        { Icon: Star,    label: "أفضل الأيام", body: "ما من أيام العمل الصالح فيها أحبُّ إلى الله من هذه.", type: "general", urgent: true },
        { Icon: Moon,    label: "الصيام",      body: "صيام الأيام التسع من أفضل الأعمال — لا تُفوّتها.", type: "fasting", urgent: true },
        { Icon: RotateCw, label: "التكبير",    body: "أكثر من التكبير المطلق في هذه الأيام المباركة.", type: "dhikr" },
        { Icon: BookOpen, label: "القرآن",     body: "اقرأ القرآن وتدبّر معانيه في أفضل الأيام.", type: "quran" },
        { Icon: Heart,   label: "الصدقة",      body: "الصدقة في أفضل الأيام تُضاعف الأجر.", type: "charity" },
        { Icon: Sunset,  label: "الصلاة",      body: "حافظ على الصلوات بطمأنينة وخشوع.", type: "prayer" },
      ],
    };
  }

  if (month === 1) {
    if (day === 10) return {
      title: `يوم عاشوراء — ${year}هـ`, kind: "muharram",
      reminders: [
        { Icon: Moon,    label: "عاشوراء",   body: "صيام عاشوراء يُكفّر السنة الماضية — لا تُفوّته.", type: "fasting", urgent: true },
        { Icon: RotateCw, label: "الدعاء",  body: "أكثر من الدعاء والاستغفار في هذا اليوم المبارك.", type: "dhikr" },
        { Icon: Heart,   label: "الصدقة",   body: "التوسعة على الأهل يوم عاشوراء من السنة.", type: "charity" },
      ],
    };
    if (day < 10) return {
      title: `شهر محرَّم ${year}هـ`, kind: "muharram",
      countdown: { days: 10 - day, label: "حتى عاشوراء" },
      reminders: [
        { Icon: Moon,    label: "الصيام",    body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم.", type: "fasting" },
        { Icon: Moon,    label: "استعداد",   body: `تبقّى ${10 - day} أيام على عاشوراء — استعدّ لصيامها.`, type: "fasting", urgent: true },
        { Icon: RotateCw, label: "الاستغفار", body: "أكثر من الاستغفار في أول السنة الهجرية الجديدة.", type: "dhikr" },
      ],
    };
    return {
      title: `شهر محرَّم ${year}هـ`, kind: "muharram",
      reminders: [
        { Icon: Moon,    label: "الصيام",    body: "أفضل الصيام بعد رمضان صيام شهر الله المحرَّم.", type: "fasting" },
        { Icon: RotateCw, label: "الاستغفار", body: "أكثر من الاستغفار — فالتوبة في بداية السنة بركة.", type: "dhikr" },
        { Icon: BookOpen, label: "القرآن",   body: "اجعل لك ورداً يومياً من القرآن لا تُخلّ به.", type: "quran" },
      ],
    };
  }

  if (month === 7) return {
    title: `رَجَب الأصمّ ${year}هـ — شهر حرام`, kind: "emerald",
    reminders: [
      { Icon: Moon,    label: "الصيام",    body: "رجب من الأشهر الحُرُم — أكثر من صيام النوافل.", type: "fasting" },
      { Icon: RotateCw, label: "الاستغفار", body: "اللهم بارك لنا في رجب وشعبان وبلّغنا رمضان.", type: "dhikr" },
      { Icon: BookOpen, label: "القرآن",   body: "رجب بوابة رمضان — ابدأ مراجعة القرآن الآن.", type: "quran" },
      { Icon: Heart,   label: "الصدقة",   body: "الصدقة في الأشهر الحرم أعظم أجراً.", type: "charity" },
    ],
  };

  if (month === 8) {
    const daysToRamadan = 30 - day;
    return {
      title: `شَعبان ${year}هـ — استعداد لرمضان`, kind: "shaban",
      countdown: daysToRamadan > 0 ? { days: daysToRamadan, label: "حتى رمضان" } : undefined,
      reminders: [
        { Icon: BookOpen, label: "القرآن", body: "أتمم ختم القرآن قبل رمضان — فرمضان قريب.", type: "quran", urgent: true },
        { Icon: Moon,    label: "الصيام",  body: "كان النبي ﷺ يكثر الصيام في شعبان — اقتدِ به.", type: "fasting" },
        { Icon: RotateCw, label: "الدعاء", body: "اللهم بلّغنا رمضان وأعنّا على صيامه وقيامه.", type: "dhikr" },
        { Icon: Sunset,  label: "القيام",  body: "استعدّ للتراويح — عوّد نفسك على القيام الآن.", type: "prayer" },
      ],
    };
  }

  if (month === 10 && day <= 6) return {
    title: `ست شوال ${year}هـ — لا تُفوّتها`, kind: "emerald",
    countdown: { days: 6 - day, label: "حتى تنتهي الفرصة" },
    reminders: [
      { Icon: Moon,    label: "ست شوال",  body: "من صام رمضان وأتبعه ستاً من شوال كصيام الدهر.", type: "fasting", urgent: true },
      { Icon: RotateCw, label: "شكر الله", body: "اشكر الله على إتمام رمضان — دم على الطاعة.", type: "dhikr" },
      { Icon: Heart,   label: "الصدقة",   body: "لا تنقطع عن الصدقة بعد رمضان — فالمؤمن لا موسم له.", type: "charity" },
    ],
  };

  if (month === 11) return {
    title: `ذو القَعدة ${year}هـ — شهر حرام`, kind: "emerald",
    reminders: [
      { Icon: Building2, label: "استعداد للحج", body: "ذو القعدة من أشهر الحج — تهيّأ للحج أو العمرة.", type: "hajj" },
      { Icon: Moon,      label: "الصيام",       body: "الأشهر الحرم من أفضل أوقات صيام النوافل.", type: "fasting" },
      { Icon: RotateCw,  label: "الذكر",        body: "أكثر من الاستغفار والتسبيح في الشهر الحرام.", type: "dhikr" },
    ],
  };

  // بقية الأشهر
  const DAILY: Reminder[] = [
    { Icon: Sunset,   label: "الصلاة",       body: "حافظ على الصلوات في أوقاتها مع الجماعة — فهي عمود الدين.", type: "prayer" },
    { Icon: RotateCw, label: "الأذكار",      body: "لا تُهمل أذكار الصباح والمساء — هي حصنك اليومي.", type: "dhikr" },
    { Icon: BookOpen, label: "القرآن",       body: "اجعل لك حزباً يومياً من القرآن لا تُخلّ به.", type: "quran" },
    { Icon: Moon,     label: "الصيام",       body: "صم الاثنين والخميس — سنّة النبي ﷺ، وفيهما تُعرض الأعمال.", type: "fasting" },
    { Icon: Heart,    label: "الصدقة",       body: "الصدقة تدفع البلاء وتُطفئ الخطيئة — تصدّق ولو بالقليل.", type: "charity" },
    { Icon: Users2,   label: "صلة الرحم",   body: "صل رحمك اليوم — فبرّ الوالدين من أعظم القُرُبات.", type: "general" },
    { Icon: RotateCw, label: "الاستغفار",   body: "أكثر من الاستغفار — فللمستغفرين من الله رزق وفرج.", type: "dhikr" },
    { Icon: Sunset,   label: "السنن",        body: "حافظ على سنن الصلاة الراتبة — فهي ذخر في الآخرة.", type: "prayer" },
    { Icon: BookOpen, label: "العلم الشرعي", body: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريق الجنة.", type: "general" },
    { Icon: Heart,    label: "إطعام الطعام", body: "أطعم جارك أو المحتاج — من خير الأعمال.", type: "charity" },
  ];

  const MONTH_NAMES: Record<number, string> = {
    2: "صَفَر", 3: "ربيع الأول", 4: "ربيع الآخر",
    5: "جُمادى الأولى", 6: "جُمادى الآخرة", 10: "شَوَّال",
  };

  const start = (month % 5) * 2;
  const slice = DAILY.slice(start, start + 5);
  return {
    title: `${MONTH_NAMES[month] ?? "هذا الشهر"} ${year}هـ`,
    kind: "regular",
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

  return (
    <div
      role="complementary"
      aria-label="تذكير إسلامي"
      className={`hmb-wrap hmb-period--${period.kind} hmb-type--${current.type}`}
    >
      {/* ── رأس: العنوان + العداد + زر الإغلاق ── */}
      <div className="hmb-header">
        <span className="hmb-period-title">{period.title}</span>
        {period.countdown && period.countdown.days >= 0 && (
          <span className="hmb-countdown">
            {period.countdown.days === 0 ? period.countdown.label : `${period.countdown.days} يوم ${period.countdown.label}`}
          </span>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق التذكير"
          className="hmb-dismiss-btn"
        >×</button>
      </div>

      <div className="hmb-divider" />

      {/* ── محتوى التذكير مع حركة fade+slide ── */}
      <div
        key={index}
        className={`hmb-content${visible ? " hmb-content--visible" : " hmb-content--hidden"}`}
      >
        <div className="hmb-icon">
          <current.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="hmb-content-body">
          <span className="hmb-type-badge">{current.label}</span>
          <p className={`hmb-body${current.urgent ? " hmb-body--urgent" : ""}`}>
            {current.body}
          </p>
        </div>
      </div>

      {/* ── نقاط التنقل ── */}
      {reminders.length > 1 && (
        <div className="hmb-dots">
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
                className={`hmb-dot${active ? " hmb-dot--active" : ""}`}
                aria-pressed={active}
              />
            );
          })}
          <span className="hmb-dot-counter">{index + 1}/{reminders.length}</span>
        </div>
      )}
    </div>
  );
}
