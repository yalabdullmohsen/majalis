import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { QURAN_STUDIES } from "@/lib/quran-studies-data";

export default function QuranStudiesPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الدراسات القرآنية"
      title="القصص والأمثال والسور والكلمات"
      sections={QURAN_STUDIES}
    />
  );
}
