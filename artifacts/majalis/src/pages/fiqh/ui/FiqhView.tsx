import { useEffect, useMemo } from "react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { getLobby } from "@/config/section-lobbies";
import "@/components/sections/section-cards.css";

export default function FiqhPage() {
  const lobby = useMemo(() => getLobby("fiqh"), []);

  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه الإسلامي | المجلس العلمي",
      description: "كتب الفقه وأبوابها ومسائلها: عبادات ومعاملات وأسرة وجنايات وقضاء، مع مباحث مساندة.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مسائل فقهية", "المجلس العلمي"],
    });
  }, []);

  return (
    <SectionLobby
      lobbyId="fiqh"
      title={lobby.title}
      chips={lobby.chips}
      groups={lobby.groups}
    >
      <SectionQuiz sectionId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      <div className="twh-share">
        <ShareButtons title="الفقه الإسلامي — المجلس العلمي" url="https://majlisilm.com/fiqh" />
      </div>
    </SectionLobby>
  );
}
