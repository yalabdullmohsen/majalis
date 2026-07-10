import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "الأحاديث الضعيفة | المجلس العلمي",
      description: "قائمة الأحاديث الضعيفة مع بيان علّتها، توعية علمية لتمييز الأحاديث الضعيفة وعدم الاحتجاج بها في الأحكام.",
      keywords: ["أحاديث ضعيفة", "حديث ضعيف", "علم الحديث", "درجة الحديث", "الأحاديث المردودة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الأحاديث الضعيفة",
          url: "https://majlisilm.com/hadith/daif",
          description: "قائمة بالأحاديث الضعيفة مع بيان علّة الضعف، للتوعية العلمية",
          about: { "@type": "Thing", name: "الأحاديث الضعيفة في علم مصطلح الحديث" },
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
    </>
  );
}
