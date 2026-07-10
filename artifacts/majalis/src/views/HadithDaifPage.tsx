import { useEffect } from "react";
import { HadithSection } from "./HadithPage";
import { applyPageSeo } from "@/lib/seo";

export default function HadithDaifPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/daif",
      title: "الأحاديث الضعيفة | المجلس العلمي",
      description: "قائمة الأحاديث الضعيفة مع بيان علّتها، توعية علمية لتمييز الأحاديث الضعيفة وعدم الاحتجاج بها في الأحكام.",
      keywords: ["أحاديث ضعيفة", "حديث ضعيف", "علم الحديث", "درجة الحديث", "الأحاديث المردودة"],
    });
  }, []);

  return <HadithSection authenticityClass="daif" />;
}
