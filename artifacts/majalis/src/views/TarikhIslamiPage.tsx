import { Link } from "wouter";
import { SectionAccordionLayout } from "@/components/SectionAccordionLayout";
import { TARIKH_ISLAMI } from "@/lib/tarikh-islami-data";

export default function TarikhIslamiPage() {
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
          <strong>منهج دراسة التاريخ:</strong> نروي الوقائع بعد تمحيص الروايات، ونضبط الكلام في الصحابة والفتن بضوابط أهل السنة، ونجتنب الإسرائيليات والحكايات الواهية وتنزيل النصوص على معاصرين. هذا القسم{" "}
          <em>فهرس عناوين</em> يُستكمل تدريجيًا — للتفاصيل المعتمدة راجع{" "}
          <Link href="/seerah">السيرة</Link> و<Link href="/methodology">منهج الموقع</Link>.
        </div>
      </div>
      <SectionAccordionLayout
        eyebrow="السيرة والتاريخ"
        title="التاريخ الإسلامي والحضارة"
        sections={TARIKH_ISLAMI}
        stat3Label="موضوع/باب"
        relatedLinks={[
          { href: "/seerah", label: "السيرة النبوية" },
          { href: "/scholars", label: "أعلام الإسلام" },
          { href: "/prophets", label: "قصص الأنبياء" },
          { href: "/islamic-landmarks", label: "معالم إسلامية" },
          { href: "/nations", label: "الأمم السابقة" },
        ]}
      />
    </>
  );
}
