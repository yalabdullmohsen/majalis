import { useEffect, useMemo } from "react";
import { ShareButtons } from "@/components/ContentActions";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { getCompetitionsLobbyGroup } from "@/config/competitions-hub";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import "@/components/sections/section-cards.css";

export default function CompetitionsHubView() {
  const groups = useMemo(() => [getCompetitionsLobbyGroup()], []);

  usePageView("competitions", null);

  useEffect(() => {
    applyPageSeo({
      path: "/competitions",
      title: "المسابقات | المجلس العلمي",
      description: "مسابقات علمية في القرآن الكريم والحديث الشريف والسيرة النبوية.",
      keywords: ["مسابقات", "سين جيم", "قرآن", "حديث", "سيرة", "المجلس العلمي"],
    });
  }, []);

  return (
    <SectionLobby lobbyId="hub" title="المسابقات" groups={groups}>
      <div className="twh-share">
        <ShareButtons title="المسابقات — المجلس العلمي" url="https://www.majlisilm.com/competitions" />
      </div>
    </SectionLobby>
  );
}
