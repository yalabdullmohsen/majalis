type Props = {
  title: string;
  count?: number;
  badge?: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
};

export function AdminSectionToolbar({
  title,
  count,
  badge,
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  actions,
  filters,
}: Props) {
  return (
    <div className="ast-wrap">
      <div className={`ast-header${filters || onSearchChange ? " ast-header--padded" : ""}`}>
        <h2 className="ast-title">
          {title}
          {count !== undefined && ` (${count})`}
          {badge}
        </h2>
        {actions && <div className="ast-actions">{actions}</div>}
      </div>
      {(onSearchChange || filters) && (
        <div className="ast-toolbar">
          {onSearchChange && (
            <input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="adm-input ast-search"
              aria-label="بحث"
            />
          )}
          {filters}
        </div>
      )}
    </div>
  );
}
