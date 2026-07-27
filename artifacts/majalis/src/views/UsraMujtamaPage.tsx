import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { USRA_MUJTAMA } from "@/lib/usra-mujtama-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function UsraMujtamaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الأسرة والمجتمع"
      title="العلاقات والأسرة والمسؤولية"
      sections={USRA_MUJTAMA}
      relatedLinks={accordionExploreLinks("usra")}
    />
  );
}
