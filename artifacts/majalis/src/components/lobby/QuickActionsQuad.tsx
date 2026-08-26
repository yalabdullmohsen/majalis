import { Link } from "wouter";
import type { LobbyQuadItem } from "@/config/section-lobbies";
import { prefetchRoute } from "@/lib/prefetch-route";
import { pluralArBucket } from "@/lib/arabic-count";
import { cn } from "@/lib/utils";
import "./quick-actions-quad.css";

type Props = {
  items: LobbyQuadItem[];
};

/**
 * شبكة اختصارات — ٢×٢ افتراضيًا، ٣+٢ للدروس (٥ عناصر).
 * ترتيب RTL: يمين أعلى ← يسار أعلى ← …
 */
export function QuickActionsQuad({ items }: Props) {
  return (
    <div
      className="quick-quad"
      data-quick-quad="1"
      data-count={items.length}
      dir="rtl"
    >
      {items.map((it) => {
        const countLabel = pluralArBucket(it.count, it.noun);
        const Icon = it.icon;
        return (
          <Link
            key={it.id}
            href={it.route}
            role="link"
            className={cn("quick-quad__cell", it.accent && "quick-quad__cell--accent")}
            aria-label={`افتح ${it.label} — ${countLabel}`}
            onPointerDown={() => prefetchRoute(it.route)}
          >
            <span className="quick-quad__icon" aria-hidden>
              <Icon strokeWidth={1.75} />
            </span>
            <span className="quick-quad__name">{it.label}</span>
            <span className="quick-quad__count">{countLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}
