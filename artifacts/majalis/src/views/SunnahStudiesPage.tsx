import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { SUNNAH_STUDIES } from "@/lib/sunnah-studies-data";

export default function SunnahStudiesPage() {
  return (
    <SectionAccordionLayout
      eyebrow="دراسات السنة"
      title="جوامع الكلم والسنن اليومية"
      sections={SUNNAH_STUDIES}
    />
  );
}
