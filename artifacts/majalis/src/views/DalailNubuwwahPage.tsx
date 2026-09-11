import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DALAIL_NUBUWWAH } from "@/lib/dalail-nubuwwah-data";
import { accordionExploreLinks } from "@/lib/explore-links";
import { UtilityScreen } from "@/components/design-system/screens";

export default function DalailNubuwwahPage() {
  return (
    <UtilityScreen compose="mark">
    <SectionAccordionLayout
      eyebrow="السيرة والتاريخ"
      title="دلائل النبوة"
      route="/dalail-nubuwwah"
      sections={DALAIL_NUBUWWAH}
      relatedLinks={accordionExploreLinks("dalail")}
    />
    </UtilityScreen>
  );
}
