import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";
import { ListScreen } from "@/components/design-system/screens";

export default function ImanTopicsPage() {
  return (
    <ListScreen compose="mark">
    <LazySectionAccordionPage
      eyebrow="الإيمان والعقيدة"
      title="الإيمان بالله وعالم الغيب"
      route="/iman-topics"
      exportName="IMAN_TOPICS"
      relatedKey="iman"
      load={() => import("@/lib/iman-topics-data")}
    />
    </ListScreen>
  );
}
