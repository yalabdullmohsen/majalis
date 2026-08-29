import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { HadithClassGuide } from "@/pages/hadith/ui/HadithClassGuide";

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "الأحاديث الضعيفة | سُنّة",
      description:
        "تعريف الحديث الضعيف وأمثلة ومصادر؛ روايات مشهورة مع درجتها وتخريجها — للتمييز لا للاحتجاج.",
      keywords: ["أحاديث ضعيفة", "درجة الحديث", "تخريج الحديث", "حديث مردود", "علم الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الضعيفة",
          url: "https://majlisilm.com/hadith/daif",
          description: "تعريف الضعيف مع أمثلة ومصادر وروابط لمصطلح الحديث",
          about: { "@type": "Thing", name: "درجات الحديث في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithClassGuide kind="daif" />
      <HadithSection authenticityClass="daif" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الضعيفة — سُنّة" url="https://majlisilm.com/hadith/daif" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
