import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAQASID_SHARIA } from "@/lib/maqasid-sharia-data";

export default function MaqasidShariaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="أصول الفقه"
      title="مقاصد الشريعة الإسلامية"
      sections={MAQASID_SHARIA}
    />
  );
}
