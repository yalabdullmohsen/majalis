import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Bot, CheckCircle2, Shield, Users, BookOpen, AlertTriangle, Globe } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import "@/styles/pages/methodology.css";

const SOURCES = [
  { name: "dorar.net", desc: "موسوعة الدرر السنية للأحاديث والآثار والتخريج." },
  { name: "sunnah.com", desc: "موسوعة الأحاديث النبوية مع ترجمات متعددة." },
  { name: "aladhan.com", desc: "خدمة حساب مواقيت الصلاة والتقويم الهجري." },
  { name: "alquran.cloud", desc: "بيانات القرآن الكريم بالرسم العثماني." },
  { name: "shamela.ws", desc: "المكتبة الشاملة — مكتبة رقمية للتراث الإسلامي." },
  { name: "dar-alifta.net", desc: "دار الإفتاء المصرية — فتاوى رسمية منشورة." },
  { name: "binbaz.org.sa", desc: "موقع الشيخ ابن باز — فتاوى ومواد محقَّقة." },
  { name: "islamhouse.com", desc: "مواد شرعية مترجمة بلغات متعددة تحت إشراف علمي." },
  { name: "iifa-fiqh.org", desc: "مجمع الفقه الإسلامي الدولي — قرارات وتوصيات." },
  { name: "noor-book.com", desc: "مكتبة رقمية مفتوحة لكتب علمية وتراثية." },
];

const STEPS = [
  {
    Icon: BookOpen,
    title: "المصدر الأصلي",
    desc: "يُستورد المحتوى من مصادر علمية معروفة (الدرر السنية، مجمع الفقه الإسلامي وغيرها)، ويُحفظ رابط المصدر مع كل مادة.",
  },
  {
    Icon: AlertTriangle,
    title: "كل استيراد يبقى «قيد المراجعة»",
    desc: "كل مادة تُستورد آلياً تُحفظ بحالة «قيد المراجعة»؛ تُعرض للاطلاع بوسمها الصريح، ولا تُعتمد ولا تُوسم «موثّقة» تلقائياً.",
  },
  {
    Icon: Users,
    title: "المراجعة البشرية شرط الاعتماد",
    desc: "لا تُوسم مادة «موثّقة» إلا بعد أن يراجعها إنسان مُسمّى، فيُسجَّل اسم المراجع وتاريخ المراجعة مع مصدر خارجي.",
  },
  {
    Icon: CheckCircle2,
    title: "الشارة تتبع البيانات لا النية",
    desc: "شارة «محتوى موثّق» مشروطة في النظام بوجود مراجِع بشري وتاريخ مراجعة ومصدر خارجي. وما عدا ذلك يُعرض بشارة «قيد المراجعة الشرعية».",
  },
  {
    Icon: Bot,
    title: "وسم المحتوى المولَّد آلياً",
    desc: "أي مادة مرَّ ملخّصها أو تصنيفها على نموذج لغوي تُوسم «مُولَّد آلياً»، وتظهر بشارة «مُولَّد آلياً — غير مراجَع» ولا تُوثَّق أبداً تلقائياً.",
  },
  {
    Icon: Shield,
    title: "المساعد العلمي أداة تعليمية",
    desc: "المساعد الذكي في المنصة أداة للبحث والتعلّم وتقريب المعنى — لا يُفتي، ولا تُعدّ إجاباته فتوى ولا حجّة شرعية.",
  },
];

/** ما لا نَعِد به — تصريح صريح بحدود المنصة. */
const LIMITS = [
  "المحتوى المستورد آلياً معروض للاطلاع بوسم «قيد المراجعة»، ولم يُراجعه إنسان بعد.",
  "درجة الحديث لا تُعرض إلا إذا جاءت من المصدر نفسه؛ وإذا لم ترد فيه كُتب: «الدرجة غير مثبتة في المصدر».",
  "المشايخ والعلماء لا تُعرض عليهم شارة «معتمد» إلا بمصدر خارجي مُوثَّق — وأكثر السجلات لم تُوثَّق بعد.",
  "أرقام المشاهدات والبحث تبدأ من صفر وتنمو من الاستخدام الفعلي — لا نبثّ أرقام تفاعل مُصطنعة.",
  "نُخطئ ونُصحِّح: زر «الإبلاغ عن خطأ» أسفل كل مادة، وما يثبت خطؤه يُصحَّح أو يُسحب.",
];

/** درجات التوثيق الخمس — من docs/methodology-page-content.md */
const TRUST_GRADES = [
  {
    name: "نص أصلي",
    code: "primary_text",
    meaning: "آية بسورة ورقم، أو حديث بمصنَّف ورقم، مع حكم وحاكم عند الحديث.",
  },
  {
    name: "مصدر علمي",
    code: "scholarly_source",
    meaning: "نقل عن عالم أو كتاب مسمّى بموضع يمكن الرجوع إليه (جزء/صفحة أو ما يعادلهما).",
  },
  {
    name: "قرار مؤسسي",
    code: "institutional_ruling",
    meaning: "قرار مجمع أو هيئة برقم وتاريخ.",
  },
  {
    name: "استدلال عام",
    code: "general_reasoning",
    meaning: "قاعدة فقهية أو مقصد عام بلا نص مسمّى. هذا ليس دليلاً مكتملاً.",
  },
  {
    name: "بلا مصدر",
    code: "unsourced",
    meaning: "لا يوجد ما يمكن التحقق منه بعد. نعلّمه صراحةً ولا نعرضه كموثَّق.",
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
          url: "https://www.majlisilm.com/methodology",
          description:
            "منهجية المجلس العلمي: لا وسم توثيق بلا مراجعة بشرية ومصدر خارجي، ووسم صريح للمحتوى المولَّد آلياً.",
          publisher: {
            "@type": "Organization",
            name: "المجلس العلمي",
            url: "https://www.majlisilm.com",
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
          هذه الصفحة تصف ما يفعله النظام فعلاً — لا ما نتمنّاه. الأمانة تقتضي أن نُبيّن حدودنا كما نُبيّن ضوابطنا.
        </p>
      </header>

      {/* لماذا الشفافية مهمة */}
      <section className="mtd-section">
        <h2 className="mtd-section__title">لماذا نشرنا هذه الصفحة؟</h2>
        <p className="mtd-section__body">
          في عصر الذكاء الاصطناعي وتدفق المعلومات، يصعب التمييز بين المحتوى الذي راجعه إنسان والمحتوى
          الذي مرّ على آلة. فالقاعدة عندنا واضحة:{" "}
          <strong>
            لا تُوسم مادة بـ«موثّقة» أو «معتمدة» إلا إذا راجعها إنسان مُسمّى، ولها مصدر خارجي مُثبَت
          </strong>
          . وكل ما عدا ذلك — بما فيه ما يُستورد آلياً من مصادر معروفة — يُعرض بوسم{" "}
          <strong>«قيد المراجعة الشرعية»</strong>، ويبقى معروضاً للاطلاع لا للاحتجاج.
        </p>
        <p className="mtd-section__body">
          نعرض المحتوى قيد المراجعة ولا نُخفيه، لكننا لا ندّعي فيه ما ليس فيه. والفرق بين الحالتين
          ظاهرٌ في شارة أسفل كل مادة.
        </p>
      </section>

      {/* درجات التوثيق الخمس */}
      <section className="mtd-section mtd-section--highlight">
        <h2 className="mtd-section__title">درجات توثيق المحتوى</h2>
        <p className="mtd-section__body">
          نفضّل الحقل الفارغ الصادق على مرجع يوهم بتحقّق لم يحدث.{" "}
          <strong>لا نرفع درجة أي سجل</strong>؛ عند الشك نخفّض إلى الحقيقة.
        </p>
        <ul className="mtd-guarantees">
          {TRUST_GRADES.map((g) => (
            <li key={g.code}>
              <strong>{g.name}</strong>
              {" — "}
              {g.meaning}
            </li>
          ))}
        </ul>
        <p className="mtd-section__body" style={{ marginTop: "0.85rem" }}>
          القاعدة الفقهية العامة وحدها ليست مصدراً. والإحالة إلى «مضمون الإجابة نفسها»
          ليست مرجعاً. والمتن المشبوه أو الحديث الضعيف/الموضوع إن عُرض استدلالاً يُوقف
          عن النشر حتى مراجعة بشرية.
        </p>
        <p className="mtd-section__body">
          واقع التوثيق يتغيّر مع دفعات المراجعة: كثير من أسئلة الاختبار بلا مرجع منفصل،
          وجزء من المسائل الفقهية استدلال عام موسوم كذلك دون إخفاء المسألة من العرض.
          للإبلاغ عن خطأ:{" "}
          <Link href="/contact">صفحة التواصل</Link>
          {" "}مع ذكر رابط الصفحة والمصدر المقترح.
        </p>
      </section>

      {/* المرجعية العلمية للمحتوى */}
      <section className="mtd-section mtd-section--highlight">
        <h2 className="mtd-section__title">مرجعية المحتوى الشرعي</h2>
        <ul className="mtd-guarantees">
          <li>مصدر التلقي: الكتاب والسنة الصحيحة وإجماع سلف الأمة، بفهم الصحابة ومن تبعهم بإحسان.</li>
          <li>لا يُنشر حديث بلا تخريج وحكم؛ ولا يُستدل بضعيف في حكم أو ترغيب أو ترهيب.</li>
          <li>الآيات بالرسم العثماني مع عزو السورة ورقم الآية.</li>
          <li>في العقيدة يُقرَّر مذهب أهل السنة؛ وفي الفقه تُعرض الأقوال المعتبرة ثم يُبيَّن الراجح بدليله حيث يلزم العمل.</li>
          <li>النوازل المعاصرة تُحال إلى المجامع وهيئات الفتوى المعتمدة، ولا يُفتى فيها ابتداءً من المنصة.</li>
        </ul>
        <h3 className="mtd-section__title" style={{ marginTop: "1.25rem", fontSize: "1.05rem" }}>محظورات مطلقة في النشر</h3>
        <ul className="mtd-guarantees">
          <li>الإعجاز العددي وحساب الجُمَّل.</li>
          <li>الإسرائيليات والقصص الشعبية والمنامات التي تُبنى عليها أحكام أو عقائد.</li>
          <li>تنزيل أشراط الساعة أو نصوص الفتن على أشخاص أو أحداث معاصرة.</li>
          <li>تكفير المعيَّن، وتصنيف الجماعات المعاصرة ضمن الفرق بلا ضوابط العلم.</li>
          <li>تعبير «البدعة الحسنة» في تقرير المسائل العبادية.</li>
          <li>اختراع مصادر أو أرقام صفحات غير موجودة.</li>
        </ul>
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
        <h2 className="mtd-section__title">ما نضمنه لك</h2>
        <ul className="mtd-guarantees">
          <li>القرآن الكريم لا يُعدَّل حرفٌ واحد من نصه — البيانات من alquran.cloud بالرسم العثماني</li>
          <li>الفتاوى تُنسب لأصحابها مع مصادرها الأصلية، والتفاسير مُنسوبة لمؤلفيها</li>
          <li>لا نصنع «أحكاماً» بتقطيع النصوص أو بتحويل أسئلة المسابقات إلى أحكام شرعية</li>
          <li>لا نُلصق بحديثٍ درجةً لم ترد في مصدره، ولا نلوّن المجهول بلون الصحيح</li>
          <li>لا نمنح شارة توثيق إلا بمراجِع بشري مُسمّى وتاريخ مراجعة ومصدر خارجي</li>
        </ul>
      </section>

      {/* حدود صريحة — ما لا نضمنه */}
      <section className="mtd-section">
        <h2 className="mtd-section__title">
          <AlertTriangle size={18} strokeWidth={1.8} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle", marginLeft: "0.4rem" }} />
          حدودنا — ما لا نضمنه بعد
        </h2>
        <ul className="mtd-guarantees">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mtd-section__body">
          المنصة أداة تُقرّب طالب العلم من المصادر، ولا تقوم مقام العالم. وفي مسائل الفتوى والنوازل
          والأحوال الشخصية: اسأل أهل العلم المعتبرين في بلدك.
        </p>
      </section>

      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="aqeeda" title="اختبر معلوماتك في العقيدة والمنهج" count={4} />
      </div>
      <div className="mtd-back">
        <Link href="/" className="uc-back">
          <ArrowRight size={18} aria-hidden="true" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
