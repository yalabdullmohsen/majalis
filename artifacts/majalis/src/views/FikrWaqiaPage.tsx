import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { FIKR_WAQIA } from "@/lib/fikr-waqia-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function FikrWaqiaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الفكر والواقع"
      title="الشباب والعمل والتقنية والقرارات"
      sections={FIKR_WAQIA}
      relatedLinks={accordionExploreLinks("fikr")}
    />
  );
}
