import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function HadithMawduPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/mawdu",
      title: "الأحاديث الموضوعة والمكذوبة | المجلس العلمي",
      description: "قائمة الأحاديث الموضوعة والمكذوبة على النبي ﷺ، توعية علمية بالأحاديث المردودة وبيان علتها.",
      keywords: ["أحاديث موضوعة", "أحاديث مكذوبة", "حديث موضوع", "علم الحديث", "الأحاديث المردودة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الموضوعة والمكذوبة",
          url: "https://majlisilm.com/hadith/mawdu",
          description: "بيان الأحاديث الموضوعة والمكذوبة على النبي ﷺ للتحذير منها",
          about: { "@type": "Thing", name: "الأحاديث الموضوعة في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="mawdu" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الموضوعة والمكذوبة — المجلس العلمي" url="https://majlisilm.com/hadith/mawdu" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
