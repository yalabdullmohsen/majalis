import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";

export default function FiqhCouncilResolutionsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/resolutions",
      title: "قرارات المجمع الفقهي | المجلس العلمي",
      description: "قرارات المجمع الفقهي الإسلامي في المسائل المعاصرة، موثقة بأدلتها ومراجعها الشرعية.",
      keywords: ["قرارات فقهية", "مجمع فقهي", "قرارات إسلامية", "هيئة كبار العلماء"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "قرارات المجمع الفقهي", url: "https://majlisilm.com/fiqh-council/resolutions", about: { "@type": "Thing", name: "القرارات الفقهية الجماعية الإسلامية" } }],
    });
  }, []);

  return (
    <FiqhCouncilListPage
      typeFilter="resolution"
      title="قرارات المجمع الفقهي"
      subtitle="قرارات المجمع الفقهي الإسلامي في القضايا المعاصرة، مع تصنيف ومراجع."
      showTypeFilter={false}
    />
  );
}
