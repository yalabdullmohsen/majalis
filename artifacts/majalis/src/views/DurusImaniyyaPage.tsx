import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DURUS_IMANIYYA } from "@/lib/durus-imaniyya-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function DurusImaniyyaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="التربية والتزكية"
      title="الدروس الإيمانية والتربوية"
      sections={DURUS_IMANIYYA}
      stat3Label="سلاسل"
      stat3Value={5}
      relatedLinks={accordionExploreLinks("durusImaniyya")}
    />
  );
}
