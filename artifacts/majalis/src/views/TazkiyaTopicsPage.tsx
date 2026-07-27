import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { TAZKIYA_TOPICS } from "@/lib/tazkiya-topics-data";

export default function TazkiyaTopicsPage() {
  return (
    <SectionAccordionLayout
      eyebrow="تزكية النفس والأخلاق"
      title="الأخلاق والأمراض والأسئلة الكبرى"
      sections={TAZKIYA_TOPICS}
      relatedLinks={[
        { href: "/akhlaq", label: "الأخلاق" },
        { href: "/raqaiq", label: "الرقائق" },
        { href: "/adhkar", label: "الأذكار" },
        { href: "/sins-and-rights", label: "الذنوب والحقوق" },
        { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
      ]}
    />
  );
}
