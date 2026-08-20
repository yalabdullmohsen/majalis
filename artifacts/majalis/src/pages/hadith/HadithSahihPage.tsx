import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function HadithSahihPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/sahih",
      title: "الأحاديث الصحيحة — مرجع الصحيحين | المجلس العلمي",
      description: "مرجع صحيح البخاري (٧٥٨٠) وصحيح مسلم (٧٣٦٠) كاملاً مع بحث وتصفية؛ الصحة بعضوية الصحيحين، بلا درجات ملفّقة.",
      keywords: ["أحاديث صحيحة", "صحيح البخاري", "صحيح مسلم", "الصحيحان", "مرجع الحديث", "الحديث الصحيح"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الصحيحة — مرجع الصحيحين",
          url: "https://www.majlisilm.com/hadith/sahih",
          description: "مرجع الصحيحين الكامل مع عرض المتن بلا سند وبحث متعدد الطرق",
          about: { "@type": "Thing", name: "صحيح البخاري وصحيح مسلم" },
        },
      ],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="sahih" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الصحيحة — المجلس العلمي" url="https://www.majlisilm.com/hadith/sahih" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </>
  );
}
