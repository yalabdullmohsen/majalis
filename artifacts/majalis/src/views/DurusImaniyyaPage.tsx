import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { DURUS_IMANIYYA } from "@/lib/durus-imaniyya-data";

export default function DurusImaniyyaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="التربية والتزكية"
      title="الدروس الإيمانية والتربوية"
      sections={DURUS_IMANIYYA}
      stat3Label="سلاسل"
      stat3Value={5}
      relatedLinks={[
        { href: "/tawhid", label: "التوحيد" },
        { href: "/iman-topics", label: "موضوعات الإيمان" },
        { href: "/kids", label: "قسم الأطفال" },
        { href: "/lessons", label: "الدروس العلمية" },
        { href: "/learning/paths", label: "المسارات العلمية" },
      ]}
    />
  );
}
