import { BookOpen, Moon, ScrollText, type LucideIcon } from "lucide-react";
import { pluralAr, NOUN_ASILA } from "@/lib/arabic-count";
import type { LobbyGroup } from "@/config/section-lobbies";

export const COMPETITION_CATEGORY_IDS = ["quran", "hadith", "sira"] as const;
export type CompetitionCategoryId = (typeof COMPETITION_CATEGORY_IDS)[number];

const COMPETITION_TILES: ReadonlyArray<{
  id: CompetitionCategoryId;
  name: string;
  count: number;
  icon: LucideIcon;
}> = [
  { id: "quran", name: "القرآن الكريم", count: 60, icon: BookOpen },
  { id: "hadith", name: "الحديث الشريف", count: 60, icon: ScrollText },
  { id: "sira", name: "السيرة النبوية", count: 60, icon: Moon },
];

export function totalCompetitionQuestions(): number {
  return COMPETITION_TILES.reduce((sum, tile) => sum + tile.count, 0);
}

export function getCompetitionsLobbyGroup(): LobbyGroup {
  return {
    id: "competitions-topics",
    title: "اختر المسابقة",
    items: COMPETITION_TILES.map((tile) => ({
      id: `competition-${tile.id}`,
      label: tile.name,
      subtitle: pluralAr(tile.count, NOUN_ASILA),
      route: `/quiz?cats=${tile.id}`,
      icon: tile.icon,
    })),
  };
}
