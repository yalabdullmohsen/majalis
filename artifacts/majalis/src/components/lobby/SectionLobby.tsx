import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { FeaturedSectionCard } from "@/components/sections/FeaturedSectionCard";
import { SectionCard } from "@/components/sections/SectionCard";
import type { LobbyChip, LobbyGroup, LobbyId, LobbyItem, LobbyPrimary } from "@/config/section-lobbies";
import type { SectionDef } from "@/config/sections.registry";
import { goBackOrFallback } from "@/lib/navigation-back";
import { cn } from "@/lib/utils";
import "./section-lobby.css";

type LobbySurfaceId = LobbyId | "hub";

type Props = {
  title: string;
  lobbyId: LobbySurfaceId;
  primary?: LobbyPrimary;
  chips?: Array<LobbyChip & { href?: string; active?: boolean; onSelect?: () => void }>;
  groups: LobbyGroup[];
  /** ورقة تصفية فقط — بلا حقل بحث */
  filterSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
};

function asSection(item: LobbyItem): SectionDef {
  return {
    id: item.id,
    label: item.label,
    subtitle: item.subtitle,
    route: item.route,
    icon: item.icon,
    group: "sciences",
    order: 0,
    surfaces: ["search"],
    status: "live",
    keywords: [],
    hub: "sections",
  };
}

/**
 * لوبي موحّد لجذور التبويبات والهبات.
 * التشريح ثابت: عنوان → إجراء أساسي واحد → شرائح → مجموعات بطاقات محايدة.
 */
export function SectionLobby({
  title,
  lobbyId,
  primary,
  chips,
  groups,
  filterSlot,
  children,
  className,
}: Props) {
  const [location] = useLocation();
  return (
    <div
      className={cn("section-lobby", className)}
      dir="rtl"
      data-section-lobby={lobbyId}
      data-quran-hub={lobbyId === "quran" ? "1" : undefined}
      data-sections-hub={lobbyId === "sections" ? "1" : undefined}
      data-more-hub={lobbyId === "sections" ? "1" : undefined}
      data-lessons-hub={lobbyId === "lessons" ? "1" : undefined}
    >
      <div className="section-lobby__shot" data-lobby-shot="1">
        <header className="section-lobby__head">
          <button
            type="button"
            className="section-lobby__back"
            data-section-back="1"
            aria-label="رجوع"
            onClick={() => goBackOrFallback(location)}
          >
            <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} />
            <span>رجوع</span>
          </button>
          <h1
            className={cn(
              "section-lobby__title",
              lobbyId === "quran" && "quran-hub-page__title",
            )}
          >
            {title}
          </h1>
        </header>

        {primary ? (
          <div className="section-lobby__primary" aria-live="polite" aria-atomic="true">
            <FeaturedSectionCard
              section={asSection(primary)}
              resolveRoute={() => primary.route}
            />
          </div>
        ) : null}

        {chips && chips.length > 0 ? (
          <nav className="section-lobby__chips" aria-label="تصفية" role="navigation">
            {chips.map((chip) => (
              <a
                key={chip.id}
                className={cn("section-lobby__chip", chip.active && "is-active")}
                href={chip.href ?? `#lobby-${chip.id}`}
                aria-current={chip.active ? "true" : undefined}
                onClick={(e) => {
                  if (chip.onSelect) {
                    e.preventDefault();
                    chip.onSelect();
                    return;
                  }
                  if (chip.href?.startsWith("#")) {
                    e.preventDefault();
                    document.getElementById(`lobby-${chip.id}`)?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <span className="section-lobby__chip-label">{chip.label}</span>
              </a>
            ))}
          </nav>
        ) : null}

        {filterSlot}

        {groups.map((group) => {
          if (group.items.length === 0) return null;
          const solo = group.items.length === 1;
          return (
            <section
              key={group.id}
              id={`lobby-${group.id}`}
              className="section-lobby__group"
              aria-labelledby={`lobby-title-${group.id}`}
              data-more-group={lobbyId === "sections" ? group.id : undefined}
            >
              <h2
                id={`lobby-title-${group.id}`}
                className="section-lobby__group-title"
                data-more-group-title={lobbyId === "sections" ? group.id : undefined}
              >
                {group.title}
              </h2>
              <div
                className={cn("section-lobby__grid", solo && "section-lobby__grid--solo")}
                data-sections-grid={lobbyId}
              >
                {group.items.map((it) => (
                  <SectionCard key={it.id} section={asSection(it)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {children}
    </div>
  );
}
