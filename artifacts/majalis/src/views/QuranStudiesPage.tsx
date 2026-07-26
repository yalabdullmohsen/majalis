import { Link } from "wouter";
import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { QURAN_STUDIES } from "@/lib/quran-studies-data";

export default function QuranStudiesPage() {
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
          <strong>تنبيه:</strong> هذه الصفحة فهرس عناوين دراسية مختصرة. للتقرير المنهجي في علوم القرآن والإعجاز (بياني/تشريعي/غيبي فقط) راجع{" "}
          <Link href="/ulum-quran">علوم القرآن</Link> و<Link href="/quran-hub">مركز القرآن</Link>.
        </div>
      </div>
      <SectionAccordionLayout
        eyebrow="الدراسات القرآنية"
        title="القصص والأمثال والسور والكلمات"
        sections={QURAN_STUDIES}
        stat3Label="موضوع/باب"
      />
    </>
  );
}
