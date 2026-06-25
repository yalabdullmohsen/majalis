import { FiqhCouncilListPage } from "./FiqhCouncilPage";

export default function FiqhCouncilRecommendationsPage() {
  return (
    <FiqhCouncilListPage
      typeFilter="recommendation"
      title="توصيات المجمع الفقهي"
      subtitle="توصيات رسمية صادرة عن المجمع الفقهي الإسلامي — مع مراجع ومصادر موثقة."
      showTypeFilter={false}
    />
  );
}
