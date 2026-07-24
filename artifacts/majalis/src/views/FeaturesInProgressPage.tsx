import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Rocket } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { applyPageSeo } from "@/lib/seo";

type FeatureStatus = "in-progress" | "planned" | "beta" | "released";

type RoadmapFeature = {
  title: string;
  description: string;
  progress: number; // 0..100
  status: FeatureStatus;
};

const STATUS_LABEL: Record<FeatureStatus, string> = {
  "in-progress": "قيد التطوير",
  beta:          "تجريبي",
  planned:       "قادم",
  released:      "مكتمل",
};

// خارطة الطريق، يعدّلها المشرف حسب ما يجري تطويره فعلياً.
const FEATURES: RoadmapFeature[] = [
  {
    title: "المصحف الرقمي الاحترافي",
    description: "604 صفحة بخط عثماني عالي الجودة، أجزاء وسور وبحث قرآني، ثلاثة أوضاع قراءة، الآيات المفضلة ⭐، التفسير المختصر (الجلالين) عند تحديد الآية، وضع التكرار (آية/صفحة/سورة)، مؤقت التوقف التلقائي، ١٦ قارئاً، إدخال مباشر لرقم الصفحة.",
    progress: 100,
    status: "released",
  },
  {
    title: "قاعدة بيانات المكتبة",
    description: "133 كتاباً في التفسير والحديث والفقه والعقيدة والأصول واللغة والبلاغة والتاريخ والآداب؛ منها الموافقات للشاطبي والفقه على المذاهب الأربعة والأدب المفرد للبخاري وروضة الطالبين والتحرير والتنوير، مع بحث وتصفية متكاملة.",
    progress: 95,
    status: "released",
  },
  {
    title: "قسم العلماء والمشايخ",
    description: "99 عالماً وشيخاً من أئمة المذاهب الأربعة والمحدثين والمفسرين والفقهاء الكبار إلى علماء الخليج والعالم المعاصرين؛ منهم الذهبي وابن حجر وابن القيم وابن باز وابن عثيمين والألباني والفوزان والخضير والغفيص والعوني والطريفي، وابن قدامة والرازي والماوردي وابن الصلاح والبغوي والسبكي. مع صحابة موثقين بسيرتهم وفضائلهم.",
    progress: 92,
    status: "released",
  },
  {
    title: "مسابقة الاختبار الإسلامي",
    description: "978+ سؤال في السيرة والفقه والعقيدة والقرآن والتاريخ والرقائق والأنبياء والفتوحات والأذكار والأمر بالمعروف والحضارة الإسلامية والصيام والهجرة والقراءات وعلوم الحديث، بمستويات متعددة وإحصائيات أداء.",
    progress: 95,
    status: "released",
  },
  {
    title: "قسم الفتاوى والأحكام",
    description: "فتاوى موثقة تشمل فقه المرأة والعبادات والمعاملات والمواريث والنوازل والأيمان والأطعمة والمعاملات الرقمية، وأحكام شرعية ومسائل فقهية معاصرة وقرارات مجمعية (منها: الإيثانازيا، الوصية الرقمية، زكاة التطبيقات)، مع أدلة ومراجع وجلسات المجمع الفقهي.",
    progress: 90,
    status: "released",
  },
  {
    title: "موسوعة الأحكام الشرعية",
    description: "533 حكماً شرعياً موثقاً مع الأدلة والمراجع في الطهارة والصلاة والزكاة والمعاملات والأسرة والميراث والحج والصيام والنوازل.",
    progress: 90,
    status: "released",
  },
  {
    title: "صفحة التوحيد والعقيدة",
    description: "أنواع التوحيد الثلاثة، أركان الإيمان الستة، الأسماء الحسنى، مسائل العقيدة، وكتب مقترحة، معتمد على منهج أهل السنة.",
    progress: 95,
    status: "released",
  },
  {
    title: "الورد اليومي من القرآن",
    description: "تتبع الصفحات اليومية مع عداد السلسلة المتواصلة، إحصائيات الأسبوع والشهر، متتبع الختمات الكامل مع حلقة تقدم وعداد الختمات المكتملة، وتقدير موعد الختم التالي.",
    progress: 96,
    status: "released",
  },
  {
    title: "فضائل الصلاة ومراتبها",
    description: "المراتب الخمسة في الصلاة بحسب ابن القيم، فضائل الصلاة من القرآن والسنة الصحيحة، ووصايا الإصلاح.",
    progress: 90,
    status: "released",
  },
  {
    title: "الدورات العلمية السنوية",
    description: "63+ دورة علمية في التفسير والحديث والعقيدة والفقه والبلاغة والنحو والفرائض والمواريث والأذكار والسيرة وأصول الفقه ومقاصد الشريعة والأربعين النووية وتفسير جزء عم والورقات، مع جداول ومتون وروابط تسجيل.",
    progress: 85,
    status: "beta",
  },
  {
    title: "قسم الإعجاز العلمي",
    description: "89+ معجزة علمية موثّقة من القرآن والسنة في الكون والطب والحيوان والبحار والإنسان وعلم الحشرات والفلك والنبات والحديد والجلد والنجوم والمياه والنحل والنمل والأجنة وتوسع الكون والدورة المائية، مع التحقق العلمي والمراجع.",
    progress: 85,
    status: "beta",
  },
  {
    title: "الفوائد والنوادر العلمية",
    description: "496+ فائدة منتقاة في العقيدة والفقه والحديث والقرآن والتفسير والسيرة والتربية والأخلاق والرقائق والدعاء والأمر بالمعروف والإخلاص والغيبة والصدقة الجارية ومعاني الدنيا، بقلم العلماء والمحققين.",
    progress: 85,
    status: "beta",
  },
  {
    title: "الأذان والمؤذنون",
    description: "مكتبة الأذان بأصوات المؤذنين، تقييمات، مفضلة، وإعدادات التنبيه.",
    progress: 65,
    status: "in-progress",
  },
  {
    title: "الوضع دون اتصال (PWA)",
    description: "تثبيت التطبيق على الجهاز وتصفح الأذكار والقرآن والفتاوى والمكتبة دون إنترنت. Service Worker v17 يُخزِّن 22+ مساراً والأصول المُبعثرة، manifest موحَّد مع icons maskable وshortcuts لـ6 أقسام.",
    progress: 92,
    status: "released",
  },
  {
    title: "نظام الإشعارات الذكي",
    description: "إشعارات بمواقيت الصلاة والأذكار والدروس والمستجدات مع دعم PWA لجميع الأجهزة. تذكيرات يومية للورد القرآني والحفظ بأوقات مخصصة.",
    progress: 72,
    status: "in-progress",
  },
  {
    title: "التوصيات الذكية المخصّصة",
    description: "توصيات دقيقة مبنية على اهتماماتك وسجل قراءتك والعلاقات المعرفية.",
    progress: 58,
    status: "in-progress",
  },
  {
    title: "بحث متقدم في القرآن",
    description: "البحث بنص الآية أو رقم السورة أو الجزء أو رقم الصفحة مع عرض النتائج فورياً، مدمج في شاشة المصحف.",
    progress: 95,
    status: "released",
  },
  {
    title: "تخطيطات وسمات المصحف",
    description: "تخطيطات متعددة: رأسي / أفقي / ملء الشاشة / صفحة واحدة / صفحتان. سمات متنوعة: كلاسيكي / ليلي / دافئ / زمردي / ورقي. قابل للتخصيص الكامل.",
    progress: 30,
    status: "planned",
  },
  {
    title: "الفواصل والعلامات المتعددة الاستخدام",
    description: "علامات مرجعية متعددة في المصحف مع إمكانية التسمية والتصنيف (جلسة تلاوة / حفظ / مراجعة)، تزامن عبر الأجهزة.",
    progress: 20,
    status: "planned",
  },
  {
    title: "اختصارات التطبيق السريعة",
    description: "اختصارات لوحة المفاتيح وإيماءات الشاشة للوصول السريع للأقسام الرئيسية، دعم قائمة التطبيقات في iOS وAndroid.",
    progress: 15,
    status: "planned",
  },
  {
    title: "المنظومة الأمنية لـ Supabase",
    description: "SECURITY INVOKER للـ views، RLS على جميع الجداول، policies متكاملة، حماية البيانات الحساسة.",
    progress: 92,
    status: "released",
  },
  {
    title: "القصص الإسلامية",
    description: "64+ قصة كاملة غير مختصرة من تاريخ الصحابة والفتوحات والحضارة الإسلامية؛ منها صلاح الدين وطارق بن زياد ومالك بن أنس وخديجة وبدر الكبرى وعمر بن عبدالعزيز وعثمان بن عفان، مع توثيق كامل ودروس مستفادة.",
    progress: 80,
    status: "beta",
  },
  {
    title: "الشهادات العلمية الرقمية",
    description: "شهادات قابلة للتحقق بعد إكمال المسارات التعليمية والدورات.",
    progress: 30,
    status: "planned",
  },
  {
    title: "تطبيق الجوال المحلي",
    description: "تطبيق iOS/Android بأداء أفضل وميزات خاصة بالهاتف. جاهز مبدئياً عبر Capacitor ويدعم iOS و Android.",
    progress: 55,
    status: "in-progress",
  },
  {
    title: "خرائط المساجد والحلقات",
    description: "خريطة تفاعلية لمواقع الدروس والمساجد في الكويت مع معلومات المواعيد والأئمة.",
    progress: 35,
    status: "planned",
  },
  {
    title: "الخرائط الذهنية الإسلامية",
    description: "23+ خريطة ذهنية تفاعلية في العقيدة والفقه ومقاصد الشريعة وأصوله والحديث والتجويد والتفسير والسيرة والبلاغة والزهد والفرائض والتاريخ الإسلامي والصحابة ومراتب العلم، قابلة للطيّ والتوسيع.",
    progress: 96,
    status: "released",
  },
  {
    title: "قسم الرسم البياني المعرفي",
    description: "استكشاف ديناميكي لعلاقات المصطلحات والعلوم الإسلامية بصورة بيانية تفاعلية.",
    progress: 60,
    status: "in-progress",
  },
  {
    title: "موسوعة المصطلحات الإسلامية",
    description: "218+ مصطلح في العقيدة والفقه والحديث والقرآن والسيرة والأصول والبلاغة والتزكية، مع تعريفات دقيقة ومصادر موثّقة.",
    progress: 94,
    status: "released",
  },
  {
    title: "موسوعة علوم الحديث",
    description: "102+ مصطلح في علوم الحديث، أنواع الأحاديث والسند والراوي والجرح والتعديل وطبقات المحدثين وكتب الحديث الكبرى، مع نقد المتن والرواية بالمعنى والمتواتر.",
    progress: 94,
    status: "released",
  },
  {
    title: "وضع القراءة الليلي",
    description: "ثيم ليلي كامل بخلفية زمردية داكنة ونص عاجي دافئ، يُريح العين في الإضاءة المنخفضة. زر تبديل سريع Moon/Sun في شريط التنقل، وحفظ التفضيل بين الجلسات. يدعم وضع تلقائي يتبع إعداد الجهاز.",
    progress: 90,
    status: "released",
  },
  {
    title: "البطاقات الدعوية",
    description: "صانع بطاقات اقتباسات إسلامية بأربعة قوالب وثلاثة أحجام (مربع/ستوري/أفقي) قابلة للتحميل بجودة عالية.",
    progress: 90,
    status: "released",
  },
  {
    title: "البحث العربي الشامل",
    description: "بحث عربي مُعيَّر يتجاهل التشكيل والهمزات في 50+ صفحة محتوى: الأذكار، المسابقة، السيرة، الوصايا، الأذكار، المناسبات، الموضوعات، الخرائط الذهنية وغيرها.",
    progress: 96,
    status: "released",
  },
  {
    title: "التحقق من الشهادات",
    description: "نظام تحقق من شهادات إتمام المسارات التعليمية برمز فريد لكل شهادة.",
    progress: 45,
    status: "in-progress",
  },
  {
    title: "ملف الباحث الشرعي",
    description: "ملف شخصي لكل باحث يتضمن مجالات تخصصه وأبحاثه ومشاركاته في المجلس العلمي.",
    progress: 50,
    status: "in-progress",
  },
  {
    title: "موسوعة الطب النبوي",
    description: "92+ موضوع في الطب النبوي: الأعشاب كالحبة السوداء والسنا والكمون واليانسون والكركم، الأغذية كالتلبينة والتمر والعجوة والرمان والعسل وزيت الزيتون والزنجبيل وماء زمزم والثمار الداكنة، الممارسات الصحية كالحجامة والصيام الطوعي والسواك وسنن الفطرة، مع الأدلة والمستجدات العلمية.",
    progress: 88,
    status: "beta",
  },
  {
    title: "المناسبات الإسلامية",
    description: "45+ مناسبة هجرية موثقة: أعياد، ليالٍ مفضلة، أيام الجمعة والاثنين والخميس والأيام البيض، شهور الحج، أشراط الساعة، غزوات تاريخية، صيام ست شوال، مع الأعمال المستحبة والأدلة من السنة الصحيحة.",
    progress: 82,
    status: "beta",
  },
  {
    title: "الأمر بالمعروف والنهي عن المنكر",
    description: "قسم شامل للمراتب الثلاث (اليد، اللسان، القلب) وشروطها وأحكامها وضوابطها الشرعية، مع 10 كبائر منكرات و6 أعلى معروفات وأقوال كبار العلماء كالغزالي والنووي وابن القيم وابن تيمية.",
    progress: 90,
    status: "released",
  },
  {
    title: "الهيئات والمنظمات الإسلامية",
    description: "مرجع شامل لقرارات وفتاوى الهيئات الإسلامية السنية المعتمدة: المجامع الفقهية الدولية، هيئة كبار العلماء، اللجنة الدائمة، رابطة العالم الإسلامي، إدارة الإفتاء الكويتية، المجلس الأوروبي للإفتاء.",
    progress: 75,
    status: "in-progress",
  },
  {
    title: "الإعجاز العلمي القرآني",
    description: "90+ معجزة موثّقة من القرآن والسنة في الفلك والطب والحيوان والبحار والأجنة والنبات والرياح والمياه والأرض والإنسان والنحل والنمل وتوسع الكون وأصل الحديد، مع المراجع العلمية والتنبيه المنهجي على حدود الاستدلال.",
    progress: 85,
    status: "beta",
  },
  {
    title: "أداء الموقع وتحسين السرعة",
    description: "تقليل حزمة JavaScript الرئيسية بنسبة 80%، حِزم منفصلة للأذكار والفتاوى والمجمع الفقهي وق&اعدة الأسئلة، تحميل خطوط غير معيق، تحسين Service Worker v17 مع cache-first لأصول الموقع المُبعثرة.",
    progress: 88,
    status: "beta",
  },
  {
    title: "تحسين محركات البحث (SEO)",
    description: "372 صفحة مُعالَجة مسبقاً بمحتوى HTML كامل للزواحف، metadata مخصصة لكل صفحة، JSON-LD لـ100+ عالم و156+ كتاب وأكثر من 50+ مسار محتوى، sitemap يشمل 362+ رابطاً.",
    progress: 93,
    status: "released",
  },
];

export default function FeaturesInProgressPage() {
  useEffect(() => {
    // صفحة تطويرية، noindex حفاظاً على SEO
    applyPageSeo({
      path: "/features-in-progress",
      title: "مميزات قيد التطوير | المجلس العلمي",
      description: "المميزات الجديدة التي نعمل على تطويرها في المجلس العلمي ونسب إنجازها.",
      robots: "noindex, follow",
    });
  }, []);

  const overall = Math.round(FEATURES.reduce((s, f) => s + f.progress, 0) / FEATURES.length);

  return (
    <div className="fip-page" role="main">
      <header className="fip-head">
        <div className="uc-badge" aria-hidden="true">
          <Rocket size={28} strokeWidth={1.9} />
        </div>
        <h1 className="uc-title">مميزات قيد التطوير</h1>
        <p className="uc-desc">
          نعمل باستمرار على تطوير المجلس العلمي. هذه لمحة عن أبرز المميزات القادمة ونسبة إنجاز كلٍّ منها.
        </p>
        <div className="fip-overall">
          <span>متوسط الإنجاز العام</span>
          <strong>{overall.toLocaleString("ar-EG")}٪</strong>
        </div>
      </header>

      <div className="fip-grid">
        {FEATURES.map((f) => {
          const pct = Math.max(0, Math.min(100, Math.round(f.progress)));
          return (
            <article key={f.title} className="fip-card">
              <div className="fip-card__top">
                <h2 className="fip-card__title">{f.title}</h2>
                <span className={`fip-status fip-status--${f.status}`}>{STATUS_LABEL[f.status]}</span>
              </div>
              <p className="fip-card__desc">{f.description}</p>
              <div
                className="uc-progress fip-progress"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`نسبة إنجاز ${f.title}`}
              >
                <div className="uc-progress__head">
                  <span>نسبة الإنجاز</span>
                  <span className="uc-progress__pct">{pct.toLocaleString("ar-EG")}٪</span>
                </div>
                <div className="uc-progress__track">
                  <div className="uc-progress__fill fip-prog-fill" style={{ "--fip-pct": `${pct}%` } as React.CSSProperties} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fip-back-wrap">
        <Link href="/" className="uc-back">
          <ArrowRight size={18} aria-hidden="true" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
      <div className="twh-share">
        <ShareButtons title="مميزات قيد التطوير — المجلس العلمي" url="https://www.majlisilm.com/features-in-progress" />
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem 1.5rem" }}>
        <SectionQuiz categoryId={["quran","hadith","fiqh","aqeeda"]} title="اختبر معلوماتك أثناء الانتظار" count={4} />
      </div>
    </div>
  );
}
