import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site-config";
import { UtilityScreen } from "@/components/design-system/screens";
import "@/styles/pages/learn-legal-v2.css";

type VersionInfo = {
  shortCommit?: string;
  commitSha?: string;
  builtAt?: string;
  buildTime?: string;
  branch?: string;
  ref?: string;
};

export default function AboutPage() {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/about",
      title: "حول التطبيق | سُنّة",
      description:
        "تعرّف على تطبيق سُنّة — رفيقك اليومي لطلب العلم من دروس العلماء والقرآن والفوائد في تجربة واحدة.",
      keywords: [
        "حول التطبيق",
        "تطبيق سُنّة",
        "تطبيق العلوم الشرعية",
        "دروس العلماء",
        "القرآن والأذكار",
        "تعلم العلوم الشرعية",
        "سُنّة",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "سُنّة",
          url: SITE_URL,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          inLanguage: "ar",
          description:
            "تعرّف على تطبيق سُنّة — رفيقك اليومي لطلب العلم من دروس العلماء والقرآن والفوائد في تجربة واحدة.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
    <UtilityScreen compose="mark">
    <LegalPageLayout eyebrow="التطبيق" title="حول التطبيق">
      <LegalSection title="ماذا يقدّم التطبيق">
        <p>{SITE_DESCRIPTION}</p>
        <p>تعلّم من العلماء والدروس الموثقة في مكان واحد.</p>
        <p>
          أكمل رحلتك العلمية بسهولة: دروس العلماء والسلاسل والقرآن والبحث والمفضلة والمراجعة
          في مكان واحد.
        </p>
      </LegalSection>

      <LegalSection title="أبرز ما ستجده">
        <ul>
          <li><strong>الدروس والسلاسل:</strong> تعلّم من العلماء والدروس الموثقة بترتيب واضح.</li>
          <li><strong>القرآن:</strong> قراءة ومتابعة ضمن تجربة يومية هادئة.</li>
          <li><strong>البحث والفوائد:</strong> وصول سريع لما تحتاجه وحفظ ما ينفعك.</li>
          <li><strong>المفضلة والمراجعة:</strong> ارجع لما حفظت وواصل من حيث توقفت.</li>
          <li><strong>المسارات التعليمية:</strong> خطوات مرتبة لطالب العلم عند توفرها.</li>
        </ul>
      </LegalSection>

      <LegalSection title="تجربة الآيفون">
        <p>
          سُنّة مبنية كتطبيق أصلي للآيفون بنفس المحتوى: الدروس والعلماء والقرآن والمتابعة.
          رابط التحميل من App Store يُعرض هنا فور النشر الرسمي.
        </p>
      </LegalSection>

      <LegalSection title="رقم الإصدار">
        <p>
          الإصدار المعروض على الويب يتحدّث مع كل نشر إنتاجي.
          {version?.commitSha || version?.shortCommit ? (
            <>
              {" "}الإصدار الحالي:{" "}
              <strong dir="ltr">{version.commitSha || version.shortCommit}</strong>
              {version.branch || version.ref ? (
                <> (<span dir="ltr">{version.branch || version.ref}</span>)</>
              ) : null}
              {version.buildTime || version.builtAt ? (
                <> — بُني في {new Date(String(version.buildTime || version.builtAt)).toLocaleString("ar")}</>
              ) : null}
              .
            </>
          ) : (
            <> يمكنك أيضاً الاطلاع على ملف <span dir="ltr">/version.json</span>.</>
          )}
        </p>
      </LegalSection>

      <LegalSection title="مصادر المحتوى">
        <p>
          يُستمد المحتوى من مصادر شرعية معتبرة قدر الإمكان، مع العزو والمراجعة. التفصيل المنهجي
          في صفحة <Link href="/methodology">منهجية التوثيق</Link>
          {" "}وصفحة <Link href="/data-licenses">المصادر والتراخيص</Link>.
        </p>
      </LegalSection>

      <LegalSection title="شكر ومراجع">
        <p>
          نشكر أهل العلم والمؤسسات التي أتاحت مراجع عامة يُستفاد منها في التعلّم، ونرحّب بأي
          تصويب عبر <Link href="/contact">تواصل معنا</Link>.
        </p>
      </LegalSection>
<ShareButtons title="حول التطبيق — سُنّة" url="https://www.ssunnah.com/about" />
    </LegalPageLayout>
    </UtilityScreen>
  );
}
