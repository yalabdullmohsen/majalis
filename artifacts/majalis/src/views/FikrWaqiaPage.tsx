import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { FIKR_WAQIA } from "@/lib/fikr-waqia-data";

export default function FikrWaqiaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="الفكر والواقع"
      title="الشباب والعمل والتقنية والقرارات"
      sections={FIKR_WAQIA}
      relatedLinks={[
        { href: "/fiqh/topics/tech-fiqh", label: "فقه التقنية" },
        { href: "/fiqh-council/nawazil", label: "النوازل المعاصرة" },
        { href: "/fiqh/topics/minorities", label: "فقه الأقليات" },
        { href: "/qa", label: "الأسئلة والأجوبة" },
        { href: "/discover-islam", label: "تعرّف على الإسلام" },
      ]}
    />
  );
}
