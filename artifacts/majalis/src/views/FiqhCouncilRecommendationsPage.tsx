import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";

export default function FiqhCouncilRecommendationsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/recommendations",
      title: "توصيات المجمع الفقهي | المجلس العلمي",
      description: "التوصيات الرسمية الصادرة عن المجمع الفقهي الإسلامي في القضايا المعاصرة والشؤون الفقهية.",
      keywords: ["توصيات فقهية", "مجمع فقهي", "قرارات إسلامية", "فقه معاصر", "توصيات إسلامية"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "توصيات المجمع الفقهي", url: "https://majlisilm.com/fiqh-council/recommendations", about: { "@type": "Thing", name: "التوصيات الفقهية الجماعية" } }],
    });
  }, []);

  return (
    <FiqhCouncilListPage
      typeFilter="recommendation"
      title="توصيات المجمع الفقهي"
      subtitle="توصيات رسمية صادرة عن المجمع الفقهي الإسلامي، مع مراجع ومصادر موثقة."
      showTypeFilter={false}
    />
  );
}
