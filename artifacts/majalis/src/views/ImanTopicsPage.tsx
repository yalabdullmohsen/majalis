import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { IMAN_TOPICS } from "@/lib/iman-topics-data";

export default function ImanTopicsPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الإيمان والعقيدة"
      title="الإيمان بالله وعالم الغيب"
      sections={IMAN_TOPICS}
      stat3Label="موضوع"
      stat3Value={IMAN_TOPICS.length}
      relatedLinks={[
        { href: "/tawhid", label: "التوحيد" },
        { href: "/asma-husna", label: "أسماء الله الحسنى" },
        { href: "/arkan", label: "أركان الإسلام والإيمان" },
        { href: "/malaika", label: "الملائكة" },
        { href: "/learning/paths", label: "المسارات العلمية" },
      ]}
    />
  );
}
