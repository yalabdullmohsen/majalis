import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import type { LobbyItem } from "@/config/section-lobbies";
import "@/components/sections/section-cards.css";

export type HubCardItem = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
};

type Props = {
  path: string;
  title: string;
  description: string;
  cards: HubCardItem[];
};

/** صفحة تجميع أقسام مدمجة — لوبي موحّد دون لافتة أو وصف ظاهر. */
export default function MergedSectionHubPage({ path, title, description, cards }: Props) {
  useEffect(() => {
    applyPageSeo({
      path,
      title: `${title} | المجلس العلمي`,
      description,
      keywords: [title, "المجلس العلمي"],
    });
  }, [path, title, description]);

  const items: LobbyItem[] = useMemo(
    () =>
      cards.map((c) => ({
        id: c.href,
        label: c.title,
        subtitle: c.desc,
        route: c.href,
        icon: c.Icon,
      })),
    [cards],
  );

  return (
    <SectionLobby
      lobbyId="hub"
      title={title}
      groups={[{ id: "main", title: title, items }]}
    >
      <ShareButtons title={`${title} — المجلس العلمي`} url={`https://www.majlisilm.com${path}`} />
    </SectionLobby>
  );
}
