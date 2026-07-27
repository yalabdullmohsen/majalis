import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { MAQASID_SHARIA } from "@/lib/maqasid-sharia-data";

export default function MaqasidShariaPage() {
  return (
    <SectionAccordionLayout
      eyebrow="أصول الفقه"
      title="مقاصد الشريعة الإسلامية"
      sections={MAQASID_SHARIA}
      relatedLinks={[
        { href: "/fiqh/topics/usul-fiqh", label: "أصول الفقه" },
        { href: "/learning/paths/usool-fiqh", label: "مسار أصول الفقه" },
        { href: "/fiqh-qawaid", label: "القواعد الفقهية" },
        { href: "/fiqh", label: "بوابة الفقه" },
        { href: "/rulings", label: "موسوعة الأحكام" },
      ]}
    />
  );
}
