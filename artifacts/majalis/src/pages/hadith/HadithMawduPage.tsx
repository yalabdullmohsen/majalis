import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function HadithMawduPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/mawdu",
      title: "الأحاديث الموضوعة | المجلس العلمي",
      description: "قائمة الأحاديث الموضوعة على النبي ﷺ مع بيان من حكم بالوضع، توعية علمية للتحذير لا للاحتجاج.",
      keywords: ["أحاديث موضوعة", "حديث موضوع", "علم الحديث", "الأحاديث المردودة", "وضع الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الموضوعة",
          url: "https://www.majlisilm.com/hadith/mawdu",
          description: "بيان الأحاديث الموضوعة على النبي ﷺ للتحذير منها",
          about: { "@type": "Thing", name: "الأحاديث الموضوعة في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="mawdu" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الموضوعة — المجلس العلمي" url="https://www.majlisilm.com/hadith/mawdu" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
