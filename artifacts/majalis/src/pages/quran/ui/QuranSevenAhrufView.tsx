/**
 * نزول القرآن على سبعة أحرف — قسم داخل مركز القرآن الكريم.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { AHRUF_SECTIONS } from "@/lib/quran-ahruf/content";
import {
  ContentDetailReadingShell,
  ContentSection,
  SourceBox,
  RelatedLinksBox,
  type ReadingSectionVariant,
} from "@/components/content/ContentReading";
import "@/styles/pages/qiraat.css";
import { DashboardScreen } from "@/components/design-system/screens";

function sectionVariant(id: string): ReadingSectionVariant {
  if (id === "meaning") return "definition";
  if (id.startsWith("hadith")) return "evidence";
  if (id === "hikmah") return "lessons";
  if (id === "aqwal") return "quote";
  return "default";
}

export default function QuranSevenAhrufView() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/seven-ahruf",
      title: "الأحرف السبعة — سُنّة",
      description:
        "معنى نزول القرآن على سبعة أحرف، أحاديث الصحيحين، الفرق عن القراءات العشر، وجمع عثمان — موثّق لأهل السنة.",
      keywords: ["أحرف سبعة", "سبعة أحرف", "قراءات", "عثمان", "عمر وهشام"],
    });
  }, []);

  return (
    <DashboardScreen compose="mark">
    <SectionTemplatePage
      route="/quran-hub/seven-ahruf"
      title="الأحرف السبعة"
      subtitle="نزول القرآن على سبعة أحرف: معناه، أدلته، والفرق بينه وبين القراءات العشر."
      groupTitle="أبواب الأحرف السبعة"
    >
      <ContentDetailReadingShell
        className="qr-page"
        note="المحتوى على منهج أهل السنة والجماعة. كل نقل بمصدره الظاهر تحت كل باب."
      >
        <RelatedLinksBox
          title="روابط ذات صلة"
          links={[
            {
              href: "/quran-hub/qiraat",
              title: "القراءات العشر",
              description: "الأوجه المتواترة وعلاقتها بالأحرف.",
            },
            {
              href: "/quran-hub/tajweed",
              title: "التجويد",
              description: "أداء التلاوة وضوابط المخارج.",
            },
            {
              href: "/mushaf",
              title: "المصحف",
              description: "قراءة المصحف برواية حفص عن عاصم.",
            },
            {
              href: "/ulum-quran",
              title: "علوم القرآن",
              description: "أبواب علوم القرآن المرتبطة.",
            },
          ]}
        />

        {AHRUF_SECTIONS.map((sec) => (
          <div key={sec.id} id={sec.id} className="cr-section-wrap">
            <ContentSection
              title={sec.title}
              paragraphs={sec.body}
              variant={sectionVariant(sec.id)}
            />
            {sec.sources.length ? (
              <SourceBox title="المصادر" sources={sec.sources} />
            ) : null}
          </div>
        ))}

        <SectionQuiz
          sectionId="quran"
          title="اختبر معلوماتك في الأحرف السبعة"
          count={4}
        />
      </ContentDetailReadingShell>
    </SectionTemplatePage>
    </DashboardScreen>
  );
}
