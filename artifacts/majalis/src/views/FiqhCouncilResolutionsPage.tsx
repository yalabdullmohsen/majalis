import { FiqhCouncilListPage } from "./FiqhCouncilPage";

export default function FiqhCouncilResolutionsPage() {
  return (
    <FiqhCouncilListPage
      typeFilter="resolution"
      title="قرارات المجمع الفقهي"
      subtitle="قرارات المجمع الفقهي الإسلامي في القضايا المعاصرة — مع تصنيف ومراجع."
      showTypeFilter={false}
    />
  );
}
