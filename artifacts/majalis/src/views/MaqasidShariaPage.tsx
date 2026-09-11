import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAQASID_SHARIA } from "@/lib/maqasid-sharia-data";
import { accordionExploreLinks } from "@/lib/explore-links";
import { UtilityScreen } from "@/components/design-system/screens";

export default function MaqasidShariaPage() {
  return (
    <UtilityScreen compose="mark">
    <SectionAccordionLayout
      eyebrow="أصول الفقه"
      title="مقاصد الشريعة الإسلامية"
      route="/maqasid-sharia"
      sections={MAQASID_SHARIA}
      relatedLinks={accordionExploreLinks("maqasid")}
    />
    </UtilityScreen>
  );
}
