/**
 * جسم صفحة «الأقسام» — لوبي موحّد من سجل الأقسام.
 */
import { getLobby } from "@/config/section-lobbies";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import "@/components/sections/section-cards.css";

type Props = {
  onNavigate?: () => void;
  showSearch?: boolean;
  className?: string;
};

export function MoreHubFromRegistry(_props: Props) {
  const lobby = getLobby("sections");
  return (
    <SectionLobby
      lobbyId="sections"
      title={lobby.title}
      subtitle={lobby.subtitle}
      groups={lobby.groups}
    />
  );
}

/** اسم توافق — صفحة الأقسام */
export const SectionsHubFromRegistry = MoreHubFromRegistry;
