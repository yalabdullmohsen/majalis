import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function FiqhCouncilRecommendationsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/recommendations",
      title: "توصيات المجمع الفقهي | المجلس العلمي",
      description: "التوصيات الرسمية الصادرة عن المجمع الفقهي الإسلامي في القضايا المعاصرة والشؤون الفقهية.",
      keywords: ["توصيات فقهية", "مجمع فقهي", "قرارات إسلامية", "فقه معاصر", "توصيات إسلامية"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "توصيات المجمع الفقهي", url: "https://www.majlisilm.com/fiqh-council/recommendations", about: { "@type": "Thing", name: "التوصيات الفقهية الجماعية" } }],
    });
  }, []);

  return (
    <>
      <FiqhCouncilListPage
        typeFilter="recommendation"
        title="توصيات المجمع الفقهي"
        subtitle="توصيات رسمية صادرة عن المجمع الفقهي الإسلامي، مع مراجع ومصادر موثقة."
        showTypeFilter={false}
      />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في القضايا الفقهية" count={4} />
      </div>
    </>
  );
}
