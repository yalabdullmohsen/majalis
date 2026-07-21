import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Heart,
  Lightbulb,
  Moon,
  Puzzle,
  Scroll,
  Star,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Step = {
  num: number;
  title: string;
  desc: string;
  Icon: LucideIcon;
  links: { href: string; label: string }[];
  tip?: string;
};

const STEPS: Step[] = [
  {
    num: 1,
    title: "أساسيات العقيدة",
    desc: "ابدأ بمعرفة أركان الإيمان وأركان الإسلام، فهما الأساس الذي تُبنى عليه كل علوم الشريعة.",
    Icon: Star,
    links: [
      { href: "/arkan-iman",  label: "أركان الإيمان الستة" },
      { href: "/arkan",       label: "أركان الإسلام الخمسة" },
      { href: "/tawhid",      label: "التوحيد والعقيدة" },
    ],
    tip: "خصّص 15 دقيقة يومياً لقراءة قسم واحد.",
  },
  {
    num: 2,
    title: "الطهارة والصلاة",
    desc: "الصلاة عماد الدين. تعلّم كيفية الطهارة الصحيحة ثم دليل الصلاة المفصل.",
    Icon: Moon,
    links: [
      { href: "/tahara",      label: "الطهارة وأحكامها" },
      { href: "/salah-guide", label: "دليل الصلاة الكامل" },
    ],
    tip: "راجع هذا القسم حتى تطمئن إلى صحة صلاتك.",
  },
  {
    num: 3,
    title: "السيرة النبوية",
    desc: "دراسة سيرته ﷺ توثّق الصلة بالنبي وتُرسّخ الإيمان بمصداقية الرسالة.",
    Icon: BookMarked,
    links: [
      { href: "/seerah",    label: "السيرة النبوية كاملة" },
      { href: "/shamael",   label: "الشمائل المحمدية" },
    ],
    tip: "اقرأ المراحل بالترتيب: الميلاد ← المبعث ← الهجرة ← الفتح.",
  },
  {
    num: 4,
    title: "القرآن الكريم",
    desc: "اقرأ المصحف كاملاً بترقيم مصحف المدينة (٦٠٤ صفحة) بخط عثماني واضح، أو ابدأ من مركز القرآن للتلاوة والتفسير. ابدأ بصفحتين يومياً واستخدم الورد اليومي للمتابعة.",
    Icon: BookOpen,
    links: [
      { href: "/mushaf",      label: "المصحف (٦٠٤ صفحة)" },
      { href: "/quran-hub",   label: "مركز القرآن" },
      { href: "/daily-wird",  label: "الورد اليومي" },
      { href: "/quran/tajweed", label: "أحكام التجويد" },
    ],
    tip: "الانتظام خير من الكثرة المتقطعة.",
  },
  {
    num: 5,
    title: "الأذكار اليومية",
    desc: "أذكار الصباح والمساء حصن يومي لا غنى عنه. ابدأ بالصباح ثم المساء.",
    Icon: Heart,
    links: [
      { href: "/adhkar?cat=morning", label: "أذكار الصباح" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء" },
      { href: "/adhkar",             label: "جميع الأذكار" },
    ],
    tip: "اقرأها مرة واحدة بتمعّن أفضل من عشر مرات بغفلة.",
  },
  {
    num: 6,
    title: "الفقه العملي",
    desc: "تعلّم الفقه المتعلق بحياتك اليومية: الصيام، الزكاة، الحج إن استطعت.",
    Icon: Scroll,
    links: [
      { href: "/sawm",   label: "الصيام وأحكامه" },
      { href: "/zakat",  label: "الزكاة وأحكامها" },
      { href: "/hajj",   label: "الحج والعمرة" },
      { href: "/fiqh",   label: "بوابة الفقه الإسلامي" },
    ],
    tip: "ابدأ بما تحتاجه الآن (إن اقترب رمضان فابدأ بالصيام).",
  },
  {
    num: 7,
    title: "الدروس الشرعية المباشرة",
    desc: "انضم إلى دروس العلماء الأسبوعية. المداومة على مجلس علم مع شيخ من أعظم أسباب الثبات.",
    Icon: GraduationCap,
    links: [
      { href: "/lessons",        label: "الدروس القادمة" },
      { href: "/annual-courses", label: "الدورات العلمية" },
    ],
    tip: "التزم بمجلس واحد أسبوعياً قبل أن تزيد.",
  },
  {
    num: 8,
    title: "راجع واختبر نفسك",
    desc: "المراجعة بالاختبار ترسّخ العلم أكثر من القراءة وحدها. اختبر معلوماتك بلعبة الأسئلة، راجع بالبطاقات، أو استخدم الخرائط الذهنية لتنظيم ما حفظته.",
    Icon: Puzzle,
    links: [
      { href: "/quiz",       label: "لعبة سؤال وجواب" },
      { href: "/flashcards", label: "البطاقات الدعوية" },
      { href: "/mind-map",   label: "الخرائط الذهنية" },
    ],
    tip: "خصّص وقتاً أسبوعياً للمراجعة، لا للحفظ الجديد فقط.",
  },
  {
    num: 9,
    title: "توسيع المعرفة",
    desc: "بعد الأساسيات توسّع في العلوم: الأحاديث، علوم القرآن، الفقه المقارن، السيرة التفصيلية.",
    Icon: Target,
    links: [
      { href: "/hadith",         label: "الأحاديث النبوية" },
      { href: "/ulum-quran",     label: "علوم القرآن" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/learning/paths", label: "المسارات العلمية" },
      { href: "/knowledge-graph", label: "خارطة المعرفة التفاعلية" },
    ],
    tip: "الآن يمكنك الاختيار بحرية حسب اهتمامك.",
  },
];

const DAILY_ROUTINE = [
  { time: "الصباح",  items: ["أذكار الصباح", "صفحتان من القرآن"] },
  { time: "الظهر",   items: ["استذكر حديثاً أو فائدة"] },
  { time: "المساء",  items: ["أذكار المساء", "اقرأ موضوعاً شرعياً (10 دقائق)"] },
  { time: "الأسبوع", items: ["حضور درس شرعي مباشر", "مراجعة ما تعلمته"] },
];

export default function StartHerePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/start-here",
      title: "ابدأ من هنا — طريقك لطالب العلم | المجلس العلمي",
      description: "مسار تعريفي مرتّب لطالب العلم المبتدئ: العقيدة، الصلاة، السيرة، القرآن (بما فيه المصحف كاملاً ٦٠٤ صفحة)، الأذكار، الفقه، الدروس، والمراجعة بالاختبارات. خطوات واضحة بروابط مباشرة.",
      keywords: ["ابدأ من هنا", "طالب العلم المبتدئ", "كيف أبدأ بطلب العلم", "مسار إسلامي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "كيف تبدأ طريق طالب العلم",
          description: "مسار تعريفي مرتّب لطالب العلم المبتدئ",
          url: "https://www.majlisilm.com/start-here",
          inLanguage: "ar",
          step: STEPS.map((s) => ({
            "@type": "HowToStep",
            name: s.title,
            text: s.desc,
            position: s.num,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="sh-page" dir="rtl">
      {/* ── رأس الصفحة ── */}
      <header className="sh-hero">
        <div className="sh-hero__badge">
          <GraduationCap size={16} strokeWidth={2} aria-hidden="true" />
          <span>دليل البداية</span>
        </div>
        <h1 className="sh-hero__title">ابدأ من هنا</h1>
        <p className="sh-hero__sub">
          مسار مرتّب لطالب العلم المبتدئ — ٩ خطوات تربط المحتوى الموجود في المنصة
          بترتيب يُبني العلم طبقة فوق طبقة.
        </p>
        <div className="sh-hero__stats">
          <span className="sh-stat"><Check size={13} strokeWidth={2.5} />٩ محطات علمية</span>
          <span className="sh-stat"><Clock size={13} strokeWidth={2.5} />١٥ دقيقة يومياً تكفي</span>
          <span className="sh-stat"><Lightbulb size={13} strokeWidth={2.5} />بدون محتوى جديد مولّد</span>
        </div>
      </header>

      {/* ── الخطوات ── */}
      <ol className="sh-steps" aria-label="خطوات الدليل">
        {STEPS.map((step) => {
          const Ico = step.Icon;
          return (
            <li key={step.num} className="sh-step">
              <div className="sh-step__num" aria-label={`خطوة ${step.num}`}>{step.num}</div>
              <div className="sh-step__body">
                <div className="sh-step__head">
                  <span className="sh-step__icon" aria-hidden="true"><Ico size={18} strokeWidth={1.8} /></span>
                  <h2 className="sh-step__title">{step.title}</h2>
                </div>
                <p className="sh-step__desc">{step.desc}</p>
                <div className="sh-step__links">
                  {step.links.map((l) => (
                    <Link key={l.href} href={l.href} className="sh-step__link">
                      {l.label}
                      <ArrowLeft size={13} strokeWidth={2} className="sh-step__arrow" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
                {step.tip && (
                  <p className="sh-step__tip">
                    <Lightbulb size={12} strokeWidth={2} aria-hidden="true" />
                    {step.tip}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── الروتين اليومي ── */}
      <section className="sh-routine" aria-labelledby="sh-routine-h">
        <h2 id="sh-routine-h" className="sh-routine__title">
          <Clock size={18} strokeWidth={1.8} aria-hidden="true" />
          الروتين المقترح
        </h2>
        <div className="sh-routine__grid">
          {DAILY_ROUTINE.map((r) => (
            <div key={r.time} className="sh-routine__card">
              <p className="sh-routine__time">{r.time}</p>
              <ul className="sh-routine__list">
                {r.items.map((item) => (
                  <li key={item} className="sh-routine__item">
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── إجراء ختامي ── */}
      <div className="sh-cta">
        <Link href="/lessons" className="sh-cta__btn sh-cta__btn--primary">
          <GraduationCap size={17} strokeWidth={2} aria-hidden="true" />
          ابحث عن درس قريب منك
        </Link>
        <Link href="/adhkar" className="sh-cta__btn sh-cta__btn--secondary">
          ابدأ بالأذكار الآن
        </Link>
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["aqeeda", "fiqh", "akhlaq"]} title="اختبر معلوماتك الشرعية" count={4} />
      </div>
    </div>
  );
}
