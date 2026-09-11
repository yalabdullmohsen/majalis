import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";
import { UtilityScreen } from "@/components/design-system/screens";

export default function DurusImaniyyaPage() {
  return (
    <UtilityScreen compose="mark">
    <LazySectionAccordionPage
      eyebrow="التربية والتزكية"
      title="الدروس الإيمانية والتربوية"
      route="/durus-imaniyya"
      exportName="DURUS_IMANIYYA"
      relatedKey="durusImaniyya"
      load={() => import("@/lib/durus-imaniyya-data")}
    />
    </UtilityScreen>
  );
}
