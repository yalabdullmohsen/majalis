import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Users, BookOpen, AlertTriangle, Globe } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

const SOURCES = [
  { name: "dorar.net", desc: "موسوعة الدرر السنية للأحاديث والآثار" },
  { name: "sunnah.com", desc: "موسوعة الأحاديث النبوية المترجمة" },
  { name: "islamweb.net", desc: "مكتبة الفتاوى والبحوث الشرعية" },
  { name: "aladhan.com", desc: "خدمة حسابات مواقيت الصلاة والتقويم" },
  { name: "alquran.cloud", desc: "بيانات القرآن الكريم بالرسم العثماني" },
];

const STEPS = [
  {
    Icon: BookOpen,
    title: "المصدر الأصلي",
    desc: "يُسحب كل محتوى من مصادر علمية موثوقة (الدرر السنية، islamweb، مجمع فقهي موثق).",
  },
  {
    Icon: AlertTriangle,
    title: "is_approved = false تلقائياً",
    desc: "أي محتوى ديني يُدرج في النظام بحالة 'غير منشور' تلقائياً حتى يمر بالمراجعة البشرية.",
  },
  {
    Icon: Users,
    title: "مراجعة بشرية",
    desc: "يراجع المشرفون المتخصصون كل محتوى ديني قبل نشره، ويُسجَّل المُراجِع في حقل verified_by.",
  },
  {
    Icon: CheckCircle2,
    title: "النشر بعد الاعتماد",
    desc: "بعد التأكد من صحة المحتوى وتوافقه مع المصادر، يُعيَّن is_approved = true ويُنشر.",
  },
  {
    Icon: Shield,
    title: "منع التوليد التلقائي",
    desc: "يُمنع منعاً باتاً توليد أي محتوى شرعي بالذكاء الاصطناعي أو نشره تلقائياً.",
  },
];

export default function MethodologyPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/methodology",
      title: "منهجيتنا في التوثيق | المجلس العلمي",
      description: "مصادر التحقق، منهجية المراجعة البشرية، وضمانات الجودة في المجلس العلمي.",
      keywords: ["منهجية التوثيق", "مصادر علمية موثوقة", "مراجعة بشرية", "المجلس العلمي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "منهجيتنا في التوثيق",
          url: "https://majlisilm.com/methodology",
          description: "منهجية المجلس العلمي في مراجعة المحتوى الديني وضمان دقته قبل نشره",
          publisher: {
            "@type": "Organization",
            name: "المجلس العلمي",
            url: "https://majlisilm.com",
          },
          about: {
            "@type": "Thing",
            name: "التحقق من المحتوى الديني الإسلامي",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "المصادر العلمية المعتمدة",
          numberOfItems: SOURCES.length,
          itemListElement: SOURCES.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            description: s.desc,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="mtd-page ds-section" dir="rtl">
      <header className="mtd-head">
        <div className="mtd-head__icon" aria-hidden="true">
          <Shield size={32} strokeWidth={1.6} />
        </div>
        <h1 className="mtd-head__title">منهجيتنا في التوثيق</h1>
        <p className="mtd-head__sub">
          نلتزم بأعلى معايير الدقة والأمانة العلمية. هذه الصفحة توضح كيف نُحقّق من المحتوى ونُراجعه قبل نشره.
        </p>
      </header>

      {/* لماذا الشفافية مهمة */}
      <section className="mtd-section">
        <h2 className="mtd-section__title">لماذا نشرنا هذه الصفحة؟</h2>
        <p className="mtd-section__body">
          في عصر الذكاء الاصطناعي وتدفق المعلومات، يصعب التمييز بين المحتوى الموثوق والمُولَّد آلياً.
          المجلس العلمي يُفرّق بوضوح: <strong>كل محتوى ديني يمر بمراجعة بشرية متخصصة</strong> قبل نشره —
          لا استثناءات.
        </p>
      </section>

      {/* خطوات التحقق */}
      <section className="mtd-section">
        <h2 className="mtd-section__title">خطوات التحقق والنشر</h2>
        <ol className="mtd-steps">
          {STEPS.map(({ Icon, title, desc }, i) => (
            <li key={i} className="mtd-step">
              <div className="mtd-step__num">{i + 1}</div>
              <div className="mtd-step__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div className="mtd-step__body">
                <strong className="mtd-step__title">{title}</strong>
                <p className="mtd-step__desc">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* مصادر التحقق */}
      <section className="mtd-section">
        <h2 className="mtd-section__title">
          <Globe size={18} strokeWidth={1.8} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginLeft: "0.4rem" }} />
          مصادر التحقق المعتمدة
        </h2>
        <ul className="mtd-sources">
          {SOURCES.map(s => (
            <li key={s.name} className="mtd-source">
              <span className="mtd-source__name">{s.name}</span>
              <span className="mtd-source__desc">{s.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ضمانات */}
      <section className="mtd-section mtd-section--highlight">
        <h2 className="mtd-section__title">ضماناتنا للمستخدم</h2>
        <ul className="mtd-guarantees">
          <li>لا يُنشر أي حديث نبوي إلا بعد التحقق من سنده ودرجته من مصادر معتمدة</li>
          <li>الفتاوى تُنسب لأصحابها مع مصادرها الأصلية</li>
          <li>القرآن الكريم لا يُعدَّل حرفٌ واحد من نصه — البيانات من alquran.cloud بالرسم العثماني</li>
          <li>التفاسير مُنسوبة لأصحابها (تفسير الجلالين، وغيره) مع الإشارة لمصدرها</li>
          <li>لا يوجد محتوى ديني مُولَّد بالذكاء الاصطناعي في المنصة</li>
        </ul>
      </section>

      <div className="mtd-back">
        <Link href="/" className="uc-back">
          <ArrowRight size={18} aria-hidden="true" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
