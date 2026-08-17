import type { ReactNode } from "react";
import { FeaturedSectionCard } from "@/components/sections/FeaturedSectionCard";
import { SectionCard } from "@/components/sections/SectionCard";
import type { LobbyChip, LobbyGroup, LobbyId, LobbyItem, LobbyPrimary } from "@/config/section-lobbies";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";
import "./section-lobby.css";

type LobbySurfaceId = LobbyId | "hub";

type LobbyStatus = "ready" | "loading" | "empty" | "error";

type Props = {
  title: string;
  subtitle?: string;
  lobbyId: LobbySurfaceId;
  primary?: LobbyPrimary;
  chips?: Array<LobbyChip & { href?: string; active?: boolean; onSelect?: () => void }>;
  groups: LobbyGroup[];
  /** ورقة تصفية فقط — بلا حقل بحث */
  filterSlot?: ReactNode;
  status?: LobbyStatus;
  errorMessage?: string;
  onRetry?: () => void;
  emptyAction?: { label: string; href: string };
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
  subtitle,
  lobbyId,
  primary,
  chips,
  groups,
  filterSlot,
  status = "ready",
  errorMessage,
  onRetry,
  emptyAction,
  children,
  className,
}: Props) {
  const showBody = status === "ready";
  return (
    <div
      className={cn("section-lobby", className)}
      dir="rtl"
      data-section-lobby={lobbyId}
      data-lobby-status={status}
      data-quran-hub={lobbyId === "quran" ? "1" : undefined}
      data-sections-hub={lobbyId === "sections" ? "1" : undefined}
      data-more-hub={lobbyId === "sections" ? "1" : undefined}
      data-lessons-hub={lobbyId === "lessons" ? "1" : undefined}
    >
      <div className="section-lobby__shot" data-lobby-shot="1">
        <header className="section-lobby__head">
          <h1
            className={cn(
              "section-lobby__title",
              lobbyId === "quran" && "quran-hub-page__title",
            )}
          >
            {title}
          </h1>
          {subtitle ? <p className="section-lobby__subtitle">{subtitle}</p> : null}
        </header>

        {status === "loading" ? (
          <div className="section-lobby__grid section-lobby__skeletons" aria-busy="true" aria-label="جاري التحميل">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="section-lobby__skeleton" />
            ))}
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="section-lobby__state" role="status">
            <p className="section-lobby__state-line">لا يوجد محتوى في هذا القسم بعد.</p>
            {emptyAction ? (
              <a className="section-lobby__state-action" href={emptyAction.href}>
                {emptyAction.label}
              </a>
            ) : null}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="section-lobby__state" role="alert">
            <p className="section-lobby__state-line">{errorMessage || "تعذّر تحميل هذا القسم."}</p>
            {onRetry ? (
              <button type="button" className="section-lobby__state-action" onClick={onRetry}>
                إعادة المحاولة
              </button>
            ) : null}
          </div>
        ) : null}

        {showBody && primary ? (
          <div className="section-lobby__primary" aria-live="polite" aria-atomic="true">
            <FeaturedSectionCard
              section={asSection(primary)}
              resolveRoute={() => primary.route}
            />
          </div>
        ) : null}

        {showBody && chips && chips.length > 0 ? (
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

        {showBody ? filterSlot : null}

        {showBody
          ? groups.map((group) => {
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
            })
          : null}
      </div>

      {showBody ? children : null}
    </div>
  );
}
