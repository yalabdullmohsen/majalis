import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DURUS_MUTANAWWIA } from "@/lib/durus-mutanawwia-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function DurusMutanawwiaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="المحتوى التعليمي"
      title="دروس متنوعة"
      sections={DURUS_MUTANAWWIA}
      relatedLinks={accordionExploreLinks("durusMutanawwia")}
    />
  );
}
