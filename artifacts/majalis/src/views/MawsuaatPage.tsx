import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAWSUAAT } from "@/lib/mawsuaat-data";

export default function MawsuaatPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الموسوعة العملية"
      title="دروس يومية · موقف وحكم · بين أمرين"
      sections={MAWSUAAT}
      relatedLinks={[
        { href: "/fawaid", label: "الفوائد" },
        { href: "/qa", label: "الأسئلة والأجوبة" },
        { href: "/rulings", label: "موسوعة الأحكام" },
        { href: "/daily-wird", label: "الورد اليومي" },
        { href: "/topics", label: "فهرس الموضوعات" },
      ]}
    />
  );
}
