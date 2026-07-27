import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { USRA_MUJTAMA } from "@/lib/usra-mujtama-data";

export default function UsraMujtamaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الأسرة والمجتمع"
      title="العلاقات والأسرة والمسؤولية"
      sections={USRA_MUJTAMA}
      relatedLinks={[
        { href: "/fiqh/topics/muamalat", label: "فقه المعاملات" },
        { href: "/mawarith", label: "حاسبة المواريث" },
        { href: "/akhlaq", label: "الأخلاق" },
        { href: "/rulings?category=" + encodeURIComponent("الأسرة"), label: "أحكام الأسرة" },
        { href: "/fiqh", label: "بوابة الفقه" },
      ]}
    />
  );
}
