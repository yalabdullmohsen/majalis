import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAWSUAAT } from "@/lib/mawsuaat-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function MawsuaatPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الموسوعة العملية"
      title="دروس يومية · موقف وحكم · بين أمرين"
      sections={MAWSUAAT}
      relatedLinks={accordionExploreLinks("mawsuaat")}
    />
  );
}
