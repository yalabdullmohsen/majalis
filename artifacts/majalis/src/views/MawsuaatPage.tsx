import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAWSUAAT } from "@/lib/mawsuaat-data";
import { accordionExploreLinks } from "@/lib/explore-links";
import { UtilityScreen } from "@/components/design-system/screens";

export default function MawsuaatPage() {
  return (
    <UtilityScreen compose="mark">
    <SectionAccordionLayout
      eyebrow="الموسوعة العملية"
      title="دروس يومية · موقف وحكم · بين أمرين"
      route="/mawsuaat"
      sections={MAWSUAAT}
      relatedLinks={accordionExploreLinks("mawsuaat")}
    />
    </UtilityScreen>
  );
}
