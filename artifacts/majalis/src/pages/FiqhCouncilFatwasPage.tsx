import { FiqhCouncilListPage } from "./FiqhCouncilPage";

export default function FiqhCouncilFatwasPage() {
  return (
    <FiqhCouncilListPage
      typeFilter="fatwa"
      title="الفتاوى الجماعية"
      subtitle="فتاوى جماعية صادرة عن المجمع الفقهي الإسلامي — مع أدلة ومراجع."
      showTypeFilter={false}
    />
  );
}
