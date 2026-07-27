import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { TAZKIYA_TOPICS } from "@/lib/tazkiya-topics-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function TazkiyaTopicsPage() {
  return (
    <SectionAccordionLayout
      eyebrow="تزكية النفس والأخلاق"
      title="الأخلاق والأمراض والأسئلة الكبرى"
      sections={TAZKIYA_TOPICS}
      relatedLinks={accordionExploreLinks("tazkiya")}
    />
  );
}
