import { useEffect } from "react";
import { Link } from "wouter";
import { HadithSection } from "./HadithPage";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { AppBackButton } from "@/components/common/AppBackButton";
import "@/styles/pages/hadith.css";

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
    <div className="hadith-route" dir="rtl">
      <div className="hadith-page__chrome">
        <AppBackButton variant="inline" fallbackHref="/hadith" label="الحديث وعلومه" />
      </div>
      <p className="hadith-def-callout" role="note">
        لتعريف الموضوع وحكم روايته راجع{" "}
        <Link href="/hadith-science" className="hadith-def-callout__link">
          مصطلح الحديث
        </Link>
        .
      </p>
      <HadithSection authenticityClass="mawdu" />
      <div className="twh-share hadith-route__footer">
        <ShareButtons title="الأحاديث الموضوعة — سُنّة" url="https://www.ssunnah.com/hadith/mawdu" />
      </div>
      <div className="hadith-page__quiz hadith-route__footer">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </div>
  );
}
