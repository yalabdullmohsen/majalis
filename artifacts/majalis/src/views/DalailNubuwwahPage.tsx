import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DALAIL_NUBUWWAH } from "@/lib/dalail-nubuwwah-data";

export default function DalailNubuwwahPage() {
  return (
    <SectionAccordionLayout
      eyebrow="السيرة والتاريخ"
      title="دلائل النبوة"
      sections={DALAIL_NUBUWWAH}
      relatedLinks={[
        { href: "/seerah", label: "السيرة النبوية" },
        { href: "/prophets", label: "قصص الأنبياء" },
        { href: "/miracles", label: "المعجزات" },
        { href: "/tawhid", label: "التوحيد" },
        { href: "/hadith", label: "الحديث" },
      ]}
    />
  );
}
