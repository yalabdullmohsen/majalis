import { useEffect } from "react";
import { Link } from "wouter";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { AppBackButton } from "@/components/common/AppBackButton";
import "@/styles/pages/hadith.css";

export default function HadithSahihPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/sahih",
      title: "الأحاديث الصحيحة — مرجع الصحيحين | سُنّة",
      description:
        "تعريف الحديث الصحيح وأمثلة من الصحيحين مع مصادر وروابط داخلية؛ مرجع البخاري ومسلم بلا درجات ملفّقة.",
      keywords: ["أحاديث صحيحة", "صحيح البخاري", "صحيح مسلم", "الصحيحان", "مرجع الحديث", "الحديث الصحيح"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الصحيحة — مرجع الصحيحين",
          url: "https://www.ssunnah.com/hadith/sahih",
          description: "تعريف الحديث الصحيح ومرجع الصحيحين مع أمثلة ومصادر",
          about: { "@type": "Thing", name: "صحيح البخاري وصحيح مسلم" },
        },
      ],
    });
  }, []);

  return (
    <div className="hadith-route" dir="rtl">
      <div className="hadith-page__chrome">
        <AppBackButton variant="inline" fallbackHref="/hadith" label="الحديث وعلومه" />
      </div>
      <p className="hadith-def-callout" role="note">
        للتعريف العلمي وشروط الصحة راجع{" "}
        <Link href="/hadith-science" className="hadith-def-callout__link">
          مصطلح الحديث
        </Link>
        .
      </p>
      <HadithSection authenticityClass="sahih" />
      <div className="twh-share hadith-route__footer">
        <ShareButtons title="الأحاديث الصحيحة — سُنّة" url="https://www.ssunnah.com/hadith/sahih" />
      </div>
      <div className="hadith-page__quiz hadith-route__footer">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </div>
  );
}
