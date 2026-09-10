import { useEffect } from "react";
import { Link } from "wouter";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { AppBackButton } from "@/components/common/AppBackButton";
import { WEAK_HADITH_EDUCATIONAL_DISCLAIMER } from "@/lib/content-display-zones";
import "@/styles/pages/hadith.css";

const HADITH_DAIF_BREADCRUMBS = [
  { label: "الرئيسية", href: "/" },
  { label: "الحديث", href: "/hadith" },
  { label: "الأحاديث الضعيفة" },
];

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "أحاديث ضعيفة للتنبيه والتمييز | سُنّة",
      description:
        "تعريف الحديث الضعيف وأمثلة ومصادر — للتعليم والتمييز لا للاحتجاج في العقائد والأحكام.",
      keywords: ["أحاديث ضعيفة", "درجة الحديث", "تخريج الحديث", "حديث مردود", "علم الحديث"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الحديث", path: "/hadith" },
          { name: "الأحاديث الضعيفة", path: "/hadith/daif" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "أحاديث ضعيفة للتنبيه والتمييز",
          url: "https://www.ssunnah.com/hadith/daif",
          description: "تعريف الضعيف مع أمثلة ومصادر — للتعليم والتحذير لا للعمل",
          about: { "@type": "Thing", name: "درجات الحديث في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <div className="hadith-route" dir="rtl">
      <div className="hadith-page__chrome">
        <AppBackButton variant="inline" fallbackHref="/hadith" label="الحديث وعلومه" />
      </div>
      <Breadcrumbs items={HADITH_DAIF_BREADCRUMBS} />
      <div className="hadith-weak-banner" role="note">
        <p className="hadith-weak-banner__title">تنبيه علمي</p>
        <p className="hadith-weak-banner__text">{WEAK_HADITH_EDUCATIONAL_DISCLAIMER}</p>
      </div>
      <p className="hadith-def-callout" role="note">
        لتعريف الضعيف وشروط القبول راجع{" "}
        <Link href="/hadith-science" className="hadith-def-callout__link">
          مصطلح الحديث
        </Link>
        .
      </p>
      <HadithSection authenticityClass="daif" />
      <div className="twh-share hadith-route__footer">
        <ShareButtons title="أحاديث ضعيفة للتنبيه والتمييز — سُنّة" url="https://www.ssunnah.com/hadith/daif" />
      </div>
      <div className="hadith-page__quiz hadith-route__footer">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </div>
  );
}
