import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

type VersionInfo = {
  shortCommit?: string;
  builtAt?: string;
};

export default function AboutPage() {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/about",
      title: "حول التطبيق | المجلس العلمي",
      description: "ماذا يقدّم تطبيق المجلس العلمي: الأقسام، الأدوات، رقم الإصدار، مصادر المحتوى، وشكر للمراجع.",
      keywords: ["حول التطبيق", "المجلس العلمي", "إصدار", "أقسام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "المجلس العلمي",
          url: "https://majlisilm.com",
          applicationCategory: "EducationalApplication",
          inLanguage: "ar",
          operatingSystem: "Web, iOS, Android",
        },
      ],
    });
    void fetch("/version.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: VersionInfo | null) => {
        if (data) setVersion(data);
      })
      .catch(() => {});
  }, []);

  return (
    <LegalPageLayout eyebrow="التطبيق" title="حول التطبيق">
      <LegalSection title="ماذا يقدّم التطبيق">
        <p>
          تطبيق المجلس العلمي يجمع لطالب العلم والمسلم العام أدوات يومية ومراجع شرعية في مكان واحد:
          مصحف رقمي، أذكار موثّقة، مواقيت صلاة، مسارات علم، وبحث سريع في المحتوى.
        </p>
      </LegalSection>

      <LegalSection title="أبرز الأقسام والأدوات">
        <ul>
          <li><strong>المصحف وعلوم القرآن:</strong> قراءة ومتابعة وحفظ ومراجع مرتبطة.</li>
          <li><strong>الأذكار ومواقيت الصلاة:</strong> عون على المداومة في اليوم والليلة.</li>
          <li><strong>العلم والمحتوى:</strong> عقيدة، حديث، سيرة، فقه، تفسير، قصص أنبياء، وتاريخ.</li>
          <li><strong>أدوات التعلّم:</strong> بحث، محفوظات، تتبّع تقدّم، وتنبيهات.</li>
        </ul>
      </LegalSection>

      <LegalSection title="رقم الإصدار">
        <p>
          الإصدار المعروض على الويب يتحدّث مع كل نشر إنتاجي.
          {version?.shortCommit ? (
            <>
              {" "}الإصدار الحالي: <strong dir="ltr">{version.shortCommit}</strong>
              {version.builtAt ? <> — بُني في {new Date(version.builtAt).toLocaleString("ar")}</> : null}.
            </>
          ) : (
            <> يمكنك أيضاً الاطلاع على ملف <span dir="ltr">/version.json</span>.</>
          )}
        </p>
      </LegalSection>

      <LegalSection title="مصادر المحتوى">
        <p>
          يُستمد المحتوى من مصادر شرعية معتبرة قدر الإمكان، مع العزو والمراجعة. التفصيل المنهجي
          في صفحة <Link href="/about-us">من نحن</Link> وصفحة <Link href="/methodology">منهجية التوثيق</Link>
          وصفحة <Link href="/sources">المصادر والتراخيص</Link>.
        </p>
      </LegalSection>

      <LegalSection title="شكر ومراجع">
        <p>
          نشكر أهل العلم والمؤسسات التي أتاحت مراجع عامة يُستفاد منها في التعلّم، ونرحّب بأي
          تصويب عبر <Link href="/contact">تواصل معنا</Link>.
        </p>
      </LegalSection>

      <LegalBackLink />
      <ShareButtons title="حول التطبيق — المجلس العلمي" url="https://majlisilm.com/about" />
    </LegalPageLayout>
  );
}
