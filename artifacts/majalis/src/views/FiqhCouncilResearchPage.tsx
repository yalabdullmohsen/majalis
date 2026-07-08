import { useEffect } from "react";
import { FiqhCouncilListPage } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";

export default function FiqhCouncilResearchPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/research",
      title: "بحوث المجمع الفقهي | المجلس العلمي",
      description: "بحوث ودراسات فقهية في القضايا المعاصرة صادرة عن المجمع الفقهي — منظمة ومفهرسة وقابلة للبحث.",
      keywords: ["بحوث فقهية", "دراسات إسلامية", "فقه معاصر", "مجمع فقهي", "بحث شرعي"],
    });
  }, []);

  return (
    <FiqhCouncilListPage
      typeFilter="research"
      title="بحوث المجمع الفقهي"
      subtitle="بحوث ودراسات فقهية في القضايا المعاصرة، منظمة وقابلة للبحث."
      showTypeFilter={false}
    />
  );
}
