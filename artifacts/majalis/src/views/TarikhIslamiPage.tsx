import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { TARIKH_ISLAMI } from "@/lib/tarikh-islami-data";

export default function TarikhIslamiPage() {
  return (
    <SectionAccordionLayout
      eyebrow="السيرة والتاريخ"
      title="التاريخ الإسلامي والحضارة"
      sections={TARIKH_ISLAMI}
    />
  );
}
