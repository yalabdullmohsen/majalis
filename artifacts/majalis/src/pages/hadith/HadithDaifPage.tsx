import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "الأحاديث الضعيفة | المجلس العلمي",
      description: "روايات مشهورة على الألسنة، كلٌّ مقرونة بدرجتها وتخريجها المنسوب: منها الحسن، ومنها الضعيف، ومنها ما لا تصح نسبته — بيانٌ للتمييز.",
      keywords: ["أحاديث ضعيفة", "درجة الحديث", "تخريج الحديث", "حديث مردود", "علم الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الضعيفة",
          url: "https://majlisilm.com/hadith/daif",
          description: "روايات مشهورة مقرونة بدرجتها وتخريجها المنسوب، للتوعية العلمية والتمييز",
          about: { "@type": "Thing", name: "درجات الحديث في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="daif" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الضعيفة — المجلس العلمي" url="https://majlisilm.com/hadith/daif" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
