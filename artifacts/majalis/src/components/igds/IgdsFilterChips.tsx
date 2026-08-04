type Chip = { id: string; label: string };

type Props = {
  items: Chip[];
  activeId?: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
};

export function IgdsFilterChips({ items, activeId, onSelect, ariaLabel = "تصفية" }: Props) {
  return (
    <div className="igds-chips" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`igds-chip${active ? " is-active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
