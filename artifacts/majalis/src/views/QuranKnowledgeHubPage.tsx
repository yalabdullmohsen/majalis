import { BookMarked, BookOpen, BookText, GraduationCap } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function QuranKnowledgeHubPage() {
  return (
    <MergedSectionHubPage
      path="/quran-knowledge"
      title="القرآن وعلومه"
      description="فهرس القرآن وعلومه وأسباب النزول وقصص السور في مكان واحد."
      cards={[
        {
          href: "/quran/surahs",
          title: "فهرس القرآن",
          desc: "دليل السور الـ١١٤ مع البحث والفلاتر",
          Icon: BookText,
        },
        {
          href: "/ulum-quran",
          title: "علوم القرآن",
          desc: "النزول والجمع والإعجاز والتفسير",
          Icon: GraduationCap,
        },
        {
          href: "/quran/surah-stories",
          title: "أسباب النزول",
          desc: "أسباب النزول ومحاور السور",
          Icon: BookMarked,
        },
        {
          href: "/quran/surah-stories",
          title: "قصص القرآن",
          desc: "قصص السور والعبر المستفادة",
          Icon: BookOpen,
        },
      ]}
    />
  );
}
