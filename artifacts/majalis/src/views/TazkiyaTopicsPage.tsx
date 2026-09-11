import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";
import { UtilityScreen } from "@/components/design-system/screens";

export default function TazkiyaTopicsPage() {
  return (
    <UtilityScreen compose="mark">
    <LazySectionAccordionPage
      eyebrow="تزكية النفس والأخلاق"
      title="الأخلاق والأمراض والأسئلة الكبرى"
      route="/tazkiya-topics"
      exportName="TAZKIYA_TOPICS"
      relatedKey="tazkiya"
      load={() => import("@/lib/tazkiya-topics-data")}
    />
    </UtilityScreen>
  );
}
