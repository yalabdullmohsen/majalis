import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { SUNNAH_STUDIES } from "@/lib/sunnah-studies-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function SunnahStudiesPage() {
  return (
    <SectionAccordionLayout
      eyebrow="دراسات السنة"
      title="جوامع الكلم والسنن اليومية"
      route="/sunnah-studies"
      description={
        "فهرس عناوين مع ملخصات موجزة وتخريج حيث وُجد. للتوسع راجع مصطلح الحديث والأحاديث ومنهج الموقع."
      }
      sections={SUNNAH_STUDIES}
      relatedLinks={[
        ...accordionExploreLinks("sunnah"),
        { href: "/hadith-science", label: "مصطلح الحديث" },
        { href: "/hadith", label: "الأحاديث" },
        { href: "/methodology", label: "منهج الموقع" },
      ]}
    />
  );
}
