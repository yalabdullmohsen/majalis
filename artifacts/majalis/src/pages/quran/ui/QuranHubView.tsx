/**
 * مركز القرآن الكريم — لوبي موحّد من سجل الأقسام.
 */
import { useEffect, useMemo } from "react";
import { applyPageSeo } from "@/lib/seo";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { QuranOpenMushafCard } from "@/components/quran/QuranOpenMushafCard";
import { getLobby } from "@/config/section-lobbies";
import "@/components/sections/section-cards.css";

export default function QuranHubPage() {
  const lobby = useMemo(() => getLobby("quran"), []);
  // primary: open-mushaf — بطاقة مخصّصة خفيفة بدل المستطيل الأخضر الضخم

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن الكريم — سُنّة",
      description: "مركز القرآن الكريم: المصحف والتفسير والتلاوة وعلوم القرآن والإحصاءات الموثّقة.",
      keywords: ["القرآن الكريم", "المصحف", "تفسير", "تلاوة"],
    });
  }, []);

  return (
    <SectionLobby
      lobbyId="quran"
      title={lobby.title}
      primarySlot={<QuranOpenMushafCard />}
      groups={lobby.groups}
    />
  );
}
