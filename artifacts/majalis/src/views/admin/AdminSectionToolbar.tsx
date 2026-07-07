import { C } from "@/lib/theme";

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
    <div style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: filters || onSearchChange ? "0.875rem" : 0,
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.125rem",
            fontWeight: 700,
            color: C.emeraldDeep,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {title}
          {count !== undefined && ` (${count})`}
          {badge}
        </h2>
        {actions && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>{actions}</div>
        )}
      </div>
      {(onSearchChange || filters) && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {onSearchChange && (
            <input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="adm-input" style={{ maxWidth: "20rem", flex: "1 1 12rem" }}
              aria-label="بحث"
            />
          )}
          {filters}
        </div>
      )}
    </div>
  );
}
