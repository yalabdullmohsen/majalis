import { useEffect } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { InstagramAcademyLink } from "@/components/InstagramAcademyLink";
import { applyPageSeo } from "@/lib/seo";
import COUNTS from "@/data/content-counts.json";

export default function AboutPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/about",
      title: "من نحن | المجلس العلمي",
      description: "المجلس العلمي — منصة علمية عربية للدروس الشرعية والقرآن والأذكار والفقه والمكتبة، بمنهج أهل السنة مع أمانة علمية ووسم صريح لما يحتاج مراجعة.",
      keywords: ["المجلس العلمي", "منصة إسلامية", "منصة شرعية", "الإسلام الرقمي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "المجلس العلمي",
          url: "https://majlisilm.com",
          logo: "https://majlisilm.com/logo.png",
          description: "منصة علمية عربية للدروس الشرعية والقرآن والأذكار والفقه والمكتبة",
          foundingDate: "2024",
          areaServed: { "@type": "Country", name: "الكويت" },
          inLanguage: "ar",
          sameAs: ["https://majlisilm.com"],
        },
      ],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="تعرف علينا" title="من نحن">

      <LegalSection title="المجلس العلمي">
        <p>
          المجلس العلمي منصة علمية عربية تُعنى ببناء «الإسلام الرقمي»: جمع الدروس والقرآن
          والأذكار والفقه والمكتبة وتراجم العلماء في تجربة واضحة وآمنة، مع الحرص على الأمانة
          العلمية وعدم عرض مادة غير مراجعة على أنها قطعية التوثيق.
        </p>
        <p>
          انطلقت المنصة من الكويت لتقريب العلم الشرعي لطالب العلم وللمسلم العام، دون تشتيت
          بين مصادر متضاربة، ودون مبالغة تسويقية في أرقام أو درجات توثيق.
        </p>
      </LegalSection>

      <LegalSection title="رؤيتنا">
        <p>
          بناء منظومة الإسلام الرقمي: منصة هادئة تجمع أصالة العلم الشرعي بتجربة تقنية ميسّرة،
          وتقرّب القرآن والمعرفة والعبادة بوضوح وبدون ازدحام.
        </p>
      </LegalSection>

      <LegalSection title="رسالتنا">
        <p>
          تيسير الوصول إلى العلم الشرعي المنضبط، وربط طالب العلم بالدروس والكتب والأدوات
          الرقمية التي تعين على المداومة: مصحف، أذكار، مواقيت صلاة، مكتبة، ومسارات تعلّم.
        </p>
        <p>
          النوازل الشخصية والفتاوى الفردية تُحال إلى العلماء والجهات الرسمية المختصة؛ المنصة
          مرجع تعليمي أولي وليست جهة إفتاء شخصي.
        </p>
      </LegalSection>

      <LegalSection title="ما نقدّمه">
        <ul>
          <li>
            <strong>المصحف الرقمي:</strong> ٦٠٤ صفحة، فهرس السور والأجزاء، وأدوات قراءة ومتابعة الورد.
          </li>
          <li>
            <strong>الأذكار المأثورة:</strong> أذكار مصنّفة مع الإشارة إلى مصادرها عند توفرها،
            ووسم واضح لما يحتاج مراجعة إضافية.
          </li>
          <li>
            <strong>مواقيت الصلاة:</strong> توقيتات للمدن مع تنبيهات قابلة للتخصيص.
          </li>
          <li>
            <strong>المكتبة والعلماء:</strong> {COUNTS.books} كتابًا و{COUNTS.scholars} ترجمة —
            مادة مرجعية أولية؛ كثير منها بانتظار مراجعة متخصصة قبل أي وسم توثيق.
          </li>
          <li>
            <strong>الفقه والأحكام:</strong> {COUNTS.rulings} مسألة ضمن قسم الفقه، مع أدلة ومراجع
            حيث توفرت، وتمييز المسائل الخلافية عند الإمكان.
          </li>
          <li>
            <strong>الأسئلة العلمية ولعبة الاختبار:</strong> قسم علمي مستقل ({COUNTS.qa} سؤالًا)
            ولعبة تعليمية منفصلة ({COUNTS.quizQuestions} سؤالًا).
          </li>
          <li>
            <strong>الدروس والدورات:</strong> {COUNTS.courses} دورة علمية مجدولة مع أدوات المتابعة.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="بالأرقام (محسوبة من السجلات)">
        <ul>
          <li><strong>٦٠٤</strong> صفحة مصحف · <strong>١١٤</strong> سورة</li>
          <li><strong>{COUNTS.books}</strong> كتابًا في المكتبة</li>
          <li><strong>{COUNTS.scholars}</strong> عالِمًا في قاعدة التراجم</li>
          <li><strong>{COUNTS.rulings}</strong> مسألة فقهية</li>
          <li><strong>{COUNTS.quizQuestions}</strong> سؤالًا في لعبة الاختبار</li>
          <li><strong>{COUNTS.qa}</strong> سؤالًا علميًا</li>
          <li><strong>{COUNTS.courses}</strong> دورة علمية</li>
          <li><strong>{COUNTS.fawaid}</strong> فائدة منتقاة</li>
          <li><strong>{COUNTS.adhkar}</strong> ذكرًا/وردًا</li>
        </ul>
      </LegalSection>

      <LegalSection title="مبادئنا">
        <ul>
          <li>
            <strong>التوثيق بقدر الدليل:</strong> ننسب الأقوال إلى مصادرها عند التوفر، ولا نخترع
            مراجع أو درجات أحاديث.
          </li>
          <li>
            <strong>المراجعة البشرية:</strong> المحتوى المولَّد أو المستورد يبقى قيد المراجعة
            ولا يُوسم «موثّقًا» بلا مراجع مسمى.
          </li>
          <li>
            <strong>الإنصاف في الخلاف:</strong> نميّز الإجماع عن قول الجمهور عن المسألة الخلافية.
          </li>
          <li>
            <strong>الخصوصية والأمان:</strong> حماية بيانات المستخدم وفق سياسات المنصة.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="المحتوى والمصادر">
        <p>
          يُستمد المحتوى من مصادر شرعية معتبرة قدر الإمكان (كتب السنة، مراجع فقهية معتمدة،
          مواقع علمية مشهورة)، مع الإشارة إلى المرجع عند توفره. الأذكار تُعرض مع درجة الصحة
          المنقولة عن مصادرها عند وجودها — لا كحكم قطعي من المنصة.
        </p>
        <p>
          نرحب بالتصويبات العلمية عبر{" "}
          <a href="mailto:Majlisilm.app@gmail.com">Majlisilm.app@gmail.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="سياسة الذكاء الاصطناعي">
        <p>
          لا يُنشر محتوى شرعي مولَّد بالذكاء الاصطناعي مباشرةً على أنه موثّق. أي استيراد آلي
          يبقى في حالة مراجعة بشرية قبل الإتاحة العامة.
        </p>
      </LegalSection>

      <LegalSection title="تابعونا">
        <p>حساب المنصة على انستغرام لمحتوى إضافي وتحديثات.</p>
        <div className="contact-channels">
          <InstagramAcademyLink variant="card" />
        </div>
      </LegalSection>

      <LegalSection title="روابط مفيدة">
        <p>
          <Link href="/lessons">الدروس</Link>
          {" · "}
          <Link href="/quran-hub">القرآن</Link>
          {" · "}
          <Link href="/library">المكتبة</Link>
          {" · "}
          <Link href="/fiqh">الفقه</Link>
          {" · "}
          <Link href="/qa">الأسئلة العلمية</Link>
          {" · "}
          <Link href="/quiz">اختبر معلوماتك</Link>
          {" · "}
          <Link href="/methodology">المنهجية</Link>
          {" · "}
          <Link href="/contact">تواصل معنا</Link>
        </p>
      </LegalSection>

      <div className="twh-share">
        <ShareButtons title="من نحن — المجلس العلمي" url="https://majlisilm.com/about" />
      </div>
      <SectionQuiz topic="عن المنصة" />
      <LegalBackLink />
    </LegalPageLayout>
  );
}
