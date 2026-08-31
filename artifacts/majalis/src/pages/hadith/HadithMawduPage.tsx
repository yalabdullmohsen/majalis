import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { HadithClassGuide } from "@/pages/hadith/ui/HadithClassGuide";

export default function HadithMawduPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/mawdu",
      title: "الأحاديث الموضوعة | سُنّة",
      description:
        "تعريف الحديث الموضوع وأمثلة ومصادر؛ توعية للتحذير مع بيان حكم الأئمة — لا للاحتجاج.",
      keywords: ["أحاديث موضوعة", "حديث موضوع", "علم الحديث", "الأحاديث المردودة", "وضع الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الموضوعة",
          url: "https://www.ssunnah.com/hadith/mawdu",
          description: "تعريف الموضوع مع أمثلة ومصادر للتحذير العلمي",
          about: { "@type": "Thing", name: "الأحاديث الموضوعة في علم مصطلح الحديث" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithClassGuide kind="mawdu" />
      <HadithSection authenticityClass="mawdu" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الموضوعة — سُنّة" url="https://www.ssunnah.com/hadith/mawdu" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
