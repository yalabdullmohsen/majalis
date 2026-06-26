import { FiqhCouncilListPage } from "./FiqhCouncilPage";

export default function FiqhCouncilResearchPage() {
  return (
    <FiqhCouncilListPage
      typeFilter="research"
      title="بحوث المجمع الفقهي"
      subtitle="بحوث ودراسات فقهية في القضايا المعاصرة — منظمة وقابلة للبحث."
      showTypeFilter={false}
    />
  );
}
