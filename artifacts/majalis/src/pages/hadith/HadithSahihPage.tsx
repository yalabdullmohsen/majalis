import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { HadithClassGuide } from "@/pages/hadith/ui/HadithClassGuide";

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
          url: "https://majlisilm.com/hadith/sahih",
          description: "تعريف الحديث الصحيح ومرجع الصحيحين مع أمثلة ومصادر",
          about: { "@type": "Thing", name: "صحيح البخاري وصحيح مسلم" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithClassGuide kind="sahih" />
      <HadithSection authenticityClass="sahih" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الصحيحة — سُنّة" url="https://majlisilm.com/hadith/sahih" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
