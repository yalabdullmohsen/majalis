import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { FIKR_WAQIA } from "@/lib/fikr-waqia-data";

export default function FikrWaqiaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الفكر والواقع"
      title="الشباب والعمل والتقنية والقرارات"
      sections={FIKR_WAQIA}
    />
  );
}
