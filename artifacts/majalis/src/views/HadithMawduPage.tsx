import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

export default function HadithMawduPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/mawdu",
      title: "الأحاديث الموضوعة والمكذوبة | المجلس العلمي",
      description: "قائمة الأحاديث الموضوعة والمكذوبة على النبي ﷺ، توعية علمية بالأحاديث المردودة وبيان علتها.",
      keywords: ["أحاديث موضوعة", "أحاديث مكذوبة", "حديث موضوع", "علم الحديث", "الأحاديث المردودة"],
    });
  }, []);

  return (
    <>
      <HadithSection authenticityClass="mawdu" />
      <div className="twh-share">
        <ShareButtons title="الأحاديث الموضوعة والمكذوبة — المجلس العلمي" url="https://majlisilm.com/hadith/mawdu" />
      </div>
    </>
  );
}
