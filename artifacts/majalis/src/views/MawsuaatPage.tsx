import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAWSUAAT } from "@/lib/mawsuaat-data";

export default function MawsuaatPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الموسوعة العملية"
      title="دروس يومية · موقف وحكم · بين أمرين"
      sections={MAWSUAAT}
    />
  );
}
