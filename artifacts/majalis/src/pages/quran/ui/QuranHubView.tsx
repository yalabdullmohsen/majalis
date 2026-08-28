/**
 * مركز القرآن الكريم — لوبي موحّد من سجل الأقسام.
 */
import { useEffect, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { getLobby } from "@/config/section-lobbies";
import { loadLastPageSync } from "@/lib/quran-last-page";
import "@/components/sections/section-cards.css";

export default function QuranHubPage() {
  const lobby = useMemo(() => getLobby("quran"), []);
  const [resume, setResume] = useState({ href: "/mushaf", subtitle: lobby.primary?.subtitle ?? "" });
  // primary: open-mushaf — فتح المصحف من سجل الأقسام

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن الكريم — سُنّة",
      description: "مركز القرآن الكريم: المصحف والتفسير والتلاوة وعلوم القرآن والإحصاءات الموثّقة.",
      keywords: ["القرآن الكريم", "المصحف", "تفسير", "تلاوة"],
    });
  }, []);

  useEffect(() => {
    const page = loadLastPageSync();
    if (page && page > 1) {
      setResume({
        href: `/mushaf?page=${page}`,
        subtitle: lobby.primary?.subtitle ?? "",
      });
    }
  }, [lobby.primary?.subtitle]);

  const primary = lobby.primary
    ? { ...lobby.primary, route: resume.href, subtitle: resume.subtitle || lobby.primary.subtitle }
    : undefined;

  return (
    <SectionLobby
      lobbyId="quran"
      title={lobby.title}
      primary={primary}
      groups={lobby.groups}
    />
  );
}
