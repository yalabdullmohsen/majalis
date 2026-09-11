import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";
import { UtilityScreen } from "@/components/design-system/screens";

export default function FikrWaqiaPage() {
  return (
    <UtilityScreen compose="mark">
    <LazySectionAccordionPage
      eyebrow="الفكر والواقع"
      title="الشباب والعمل والتقنية والقرارات"
      route="/fikr-waqia"
      exportName="FIKR_WAQIA"
      relatedKey="fikr"
      load={() => import("@/lib/fikr-waqia-data")}
    />
    </UtilityScreen>
  );
}
