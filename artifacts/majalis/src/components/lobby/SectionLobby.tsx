import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { FeaturedSectionCard } from "@/components/sections/FeaturedSectionCard";
import { SectionCard } from "@/components/sections/SectionCard";
import { QuickActionsQuad } from "@/components/lobby/QuickActionsQuad";
import type { LobbyChip, LobbyGroup, LobbyId, LobbyItem, LobbyPrimary, LobbyQuadItem } from "@/config/section-lobbies";
import type { SectionDef } from "@/config/sections.registry";
import { isTabRootPath } from "@/config/section-lobby-chrome";
import { AppBackButton } from "@/components/common/AppBackButton"; // goBackOrFallback
import { cn } from "@/lib/utils";
import "./section-lobby.css";

type LobbySurfaceId = LobbyId | "hub";

type Props = {
  title: string;
  lobbyId: LobbySurfaceId;
  primary?: LobbyPrimary;
  /** محتوى مخصّص بدل بطاقة primary الافتراضية (مثل بطاقة المصحف في مركز القرآن) */
  primarySlot?: ReactNode;
  chips?: Array<LobbyChip & { href?: string; active?: boolean; onSelect?: () => void }>;
  groups: LobbyGroup[];
  quad?: LobbyQuadItem[];
  /** ورقة تصفية فقط — بلا حقل بحث */
  filterSlot?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** زر رجوع في الهيدر (أعلى) — للمسابقات وغير جذور التبويب */
  inlineHeaderBack?: boolean;
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
  primarySlot,
  chips,
  groups,
  quad,
  filterSlot,
  children,
  className,
  inlineHeaderBack = false,
}: Props) {
  const [location] = useLocation();
  /* جذور التبويب تعتمد القائمة السفلية — لا زر رجوع عائم يغطي البطاقات */
  const showFloatingBack = !inlineHeaderBack && !isTabRootPath(location);
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
          {inlineHeaderBack ? (
            <div className="section-lobby__head-row">
              <AppBackButton
                variant="lobby"
                className="section-lobby__back-inline"
                data-section-back="1"
                label="رجوع"
              />
              <h1 className="section-lobby__title section-lobby__title--centered">{title}</h1>
              <span className="section-lobby__head-spacer" aria-hidden="true" />
            </div>
          ) : (
            <>
              {showFloatingBack ? (
                <AppBackButton
                  variant="lobby"
                  className="section-lobby__back"
                  label="رجوع"
                />
              ) : null}
              <h1
                className={cn(
                  "section-lobby__title",
                  lobbyId === "quran" && "quran-hub-page__title",
                )}
              >
                {title}
              </h1>
            </>
          )}
        </header>

        {primarySlot ? (
          <div className="section-lobby__primary" aria-live="polite" aria-atomic="true">
            {primarySlot}
          </div>
        ) : primary ? (
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

        {quad ? <QuickActionsQuad items={quad} /> : null}

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
