import { BookMarked, BookOpen, BookText, GraduationCap, Waypoints } from "lucide-react";
import MergedSectionHubPage from "@/views/MergedSectionHubPage";

export default function QuranKnowledgeHubPage() {
  return (
    <MergedSectionHubPage
      path="/quran-knowledge"
      title="القرآن وعلومه"
      description="فهرس وعلوم وأسباب نزول وقصص."
      cards={[
        {
          href: "/quran/surahs",
          title: "فهرس القرآن",
          desc: "السور الـ١١٤",
          Icon: BookText,
        },
        {
          href: "/quran/revelation-order",
          title: "ترتيب النزول",
          desc: "خط زمني للسور حسب النزول",
          Icon: Waypoints,
        },
        {
          href: "/ulum-quran",
          title: "علوم القرآن",
          desc: "النزول والجمع والتفسير",
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
          desc: "قصص السور والعبر",
          Icon: BookOpen,
        },
      ]}
    />
  );
}
