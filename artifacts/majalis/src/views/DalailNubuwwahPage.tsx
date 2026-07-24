import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DALAIL_NUBUWWAH } from "@/lib/dalail-nubuwwah-data";

export default function DalailNubuwwahPage() {
  return (
    <SectionAccordionLayout
      eyebrow="السيرة والتاريخ"
      title="دلائل النبوة"
      sections={DALAIL_NUBUWWAH}
    />
  );
}
