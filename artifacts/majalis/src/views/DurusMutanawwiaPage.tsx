import { LazySectionAccordionPage } from "@/components/LazySectionAccordionPage";
import { UtilityScreen } from "@/components/design-system/screens";

export default function DurusMutanawwiaPage() {
  return (
    <UtilityScreen compose="mark">
    <LazySectionAccordionPage
      eyebrow="المحتوى التعليمي"
      title="دروس متنوعة"
      route="/durus-mutanawwia"
      exportName="DURUS_MUTANAWWIA"
      relatedKey="durusMutanawwia"
      load={() => import("@/lib/durus-mutanawwia-data")}
    />
    </UtilityScreen>
  );
}
