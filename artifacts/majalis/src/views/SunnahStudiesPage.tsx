import { Link } from "wouter";
import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { SUNNAH_STUDIES } from "@/lib/sunnah-studies-data";
import { accordionExploreLinks } from "@/lib/explore-links";

export default function SunnahStudiesPage() {
  return (
    <>
      <div className="page-shell" dir="rtl">
        <div
          className="max-w-3xl mx-auto px-4 pt-6"
          style={{
            background: "rgba(20,63,53,.06)",
            borderRight: "4px solid #143F35",
            borderRadius: ".6rem",
            padding: "1rem 1.2rem",
            marginBottom: "1rem",
            fontSize: ".95rem",
            lineHeight: 1.8,
          }}
        >
          <strong>تنبيه:</strong> فهرس عناوين مع ملخصات موجزة وتخريج حيث وُجد. للتوسع في المصطلح والكتب الستة راجع{" "}
          <Link href="/hadith-science">مصطلح الحديث</Link> و<Link href="/hadith">الأحاديث</Link> و
          <Link href="/methodology">منهج الموقع</Link>.
        </div>
      </div>
      <SectionAccordionLayout
        eyebrow="دراسات السنة"
        title="جوامع الكلم والسنن اليومية"
        sections={SUNNAH_STUDIES}
        stat3Label="موضوع/باب"
        relatedLinks={accordionExploreLinks("sunnah")}
      />
    </>
  );
}
