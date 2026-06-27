import type { ReactNode } from "react";
import { PageShell } from "./PageShell";
import { PageHeader } from "@/components/ui-common";
import { FilterBottomSheet, FilterToggle } from "./FilterBottomSheet";

type Stat = { label: string; value: string | number };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: Stat[];
  tabs?: ReactNode;
  featured?: ReactNode;
  children: ReactNode;
  filters?: ReactNode;
  filtersTitle?: string;
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  toolbar?: ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
};

export function ContentHubLayout({
  eyebrow,
  title,
  subtitle,
  stats,
  tabs,
  featured,
  children,
  filters,
  filtersTitle = "بحث وتصفية",
  filtersOpen = false,
  onFiltersOpenChange,
  toolbar,
  className = "",
}: Props) {
  return (
    <PageShell className={`content-hub ${className}`.trim()}>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      {stats && stats.length > 0 && (
        <div className="ds-stats-row" role="list">
          {stats.map((s) => (
            <div key={s.label} className="ds-stat" role="listitem">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {tabs}

      {featured}

      {(toolbar || filters) && (
        <div className="content-hub__toolbar">
          {toolbar}
          {filters && onFiltersOpenChange && (
            <FilterToggle onClick={() => onFiltersOpenChange(true)} />
          )}
        </div>
      )}

      <div className="content-hub__body">{children}</div>

      {filters && (
        <>
          <aside className="ds-filters-panel ds-filters-panel--desktop" aria-label={filtersTitle}>
            <div className="ds-filters-panel__head">
              <h2>{filtersTitle}</h2>
            </div>
            {filters}
          </aside>
          {onFiltersOpenChange && (
            <FilterBottomSheet
              open={filtersOpen}
              onClose={() => onFiltersOpenChange(false)}
              title={filtersTitle}
            >
              {filters}
            </FilterBottomSheet>
          )}
        </>
      )}
    </PageShell>
  );
}
