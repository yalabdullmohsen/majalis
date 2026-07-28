import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "الأحاديث المكذوبة | المجلس العلمي",
      description: "قائمة الأحاديث المكذوبة النسبة أو ضعيفة الإسناد المشهورة مع بيان علّتها — توعية للتمييز لا للاحتجاج.",
      keywords: ["أحاديث مكذوبة", "أحاديث ضعيفة", "حديث مردود", "علم الحديث", "درجة الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث المكذوبة",
          url: "https://www.majlisilm.com/hadith/daif",
          description: "قائمة بالأحاديث المكذوبة والضعيفة مع بيان علّتها، للتوعية العلمية",
          about: { "@type": "Thing", name: "الأحاديث المردودة في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="daif" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث المكذوبة — المجلس العلمي" url="https://www.majlisilm.com/hadith/daif" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
