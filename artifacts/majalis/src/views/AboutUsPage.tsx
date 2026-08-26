import { useEffect } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { InstagramAcademyLink } from "@/components/InstagramAcademyLink";
import { applyPageSeo } from "@/lib/seo";

export default function AboutUsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/about",
      title: "من نحن | المجلس العلمي",
      description: "تعرّف على المجلس العلمي، رسالته، منهجه على منهج أهل السنة والجماعة وفق فهم السلف، ومنهجية إعداد المحتوى ومراجعته.",
      keywords: ["المجلس العلمي", "من نحن", "منهج السلف", "منصة إسلامية", "الكويت"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "المجلس العلمي",
          url: "https://majlisilm.com",
          logo: "https://majlisilm.com/brand/official.png?v=20260825",
          description: "منصة شرعية رقمية كويتية تجمع الدروس والأحكام الشرعية والقرآن والأذكار في مرجع موثوق",
          foundingDate: "2024",
          areaServed: { "@type": "Country", name: "الكويت" },
          inLanguage: "ar",
          sameAs: ["https://www.instagram.com/Majlisalilm"],
        },
      ],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="تعرّف علينا" title="من نحن" updatedAt="2026-08-05">
      <LegalSection title="رسالة المجلس وغايته">
        <p>
          المجلس العلمي منصة شرعية رقمية كويتية أُسِّست لتكون مرجعاً علمياً موثوقاً يجمع بين
          الأصالة والحداثة؛ إذ تتضافر فيها الدروس الشرعية والمصحف الرقمي والأذكار المأثورة
          والأحكام الشرعية الموثّقة في منظومة متكاملة، سهلة الاستخدام للمسلم في كل مكان.
        </p>
        <p>
          غايتنا تيسير العلم الشرعي الصحيح الموثَّق، وربط طالب العلم بمصادره المعتبرة وأدوات
          المداومة، دون تشتيت بين مصادر يصعب التحقق من ضبطها.
        </p>
      </LegalSection>

      <LegalSection title="المنهج المعتمد">
        <p>
          نلتزم بعقيدة ومنهج <strong>أهل السنة والجماعة</strong> على فهم <strong>السلف الصالح</strong>،
          ونقدّم المحتوى بما يوافق ذلك من غير إثارة للخلاف المذموم، مع احترام الخلاف الفقهي المعتبر
          عند أهل العلم.
        </p>
      </LegalSection>

      <LegalSection title="منهجية إعداد المحتوى ومراجعته">
        <p>
          يُراجع المحتوى قبل نشره: توثيق النصوص، ضبط العزو إلى مصادره، وتمييز الثابت عن الضعيف
          أو غير المحقق قدر الطاقة. ما يُعرض للتعلّم العام لا يقوم مقام الفتوى الشخصية الملزِمة؛
          والمسائل الخاصة تُحال إلى أهل العلم.
        </p>
        <p>
          نرحّب بتصحيح الأخطاء عبر صفحة <Link href="/contact">تواصل معنا</Link>، ونصحّح ما يثبت
          بعد المراجعة في أقرب فرصة.
        </p>
      </LegalSection>

      <LegalSection title="لمن هذا التطبيق">
        <ul>
          <li>طالب العلم المبتدئ والمتوسط الذي يريد مساراً منظّماً.</li>
          <li>المسلم العام الذي يحتاج مصحفاً وأذكاراً ومواقيت وأحكاماً موثّقة.</li>
          <li>المعلّم والداعية الذي يبحث عن مراجع سريعة وواضحة.</li>
        </ul>
      </LegalSection>

      <LegalSection title="تعرّف أكثر">
        <p>
          لمعرفة ما يقدّمه التطبيق وأقسامه راجع صفحة <Link href="/about">حول التطبيق</Link>.
          ولسياسة البيانات راجع <Link href="/privacy">سياسة الخصوصية</Link>.
          ولمصادر البيانات والتراخيص راجع <Link href="/sources">المصادر والتراخيص</Link>.
        </p>
        <InstagramAcademyLink />
      </LegalSection>

      <LegalBackLink />
      <ShareButtons title="من نحن — المجلس العلمي" url="https://majlisilm.com/about-us" />
    </LegalPageLayout>
  );
}
