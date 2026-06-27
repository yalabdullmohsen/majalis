import type { CategoryStat } from "@/lib/rulings-types";
import { RULINGS_CATEGORY_TREE } from "@/lib/rulings-categories";

type Props = {
  stats: CategoryStat[];
  activeCategory: string;
  activeSubcategory?: string;
  onSelect: (category: string, subcategory?: string) => void;
};

export function RulingCategoryGrid({ stats, activeCategory, activeSubcategory, onSelect }: Props) {
  const countFor = (main: string, sub?: string) => {
    return stats
      .filter((s) => s.category === main && (!sub || s.subcategory === sub))
      .reduce((n, s) => n + s.count, 0);
  };

  const total = stats.reduce((n, s) => n + s.count, 0);

  return (
    <div className="ruling-category-grid">
      <button
        type="button"
        className={`ruling-category-card${activeCategory === "الكل" ? " ruling-category-card--active" : ""}`}
        onClick={() => onSelect("الكل")}
      >
        <span className="ruling-category-card__icon">📚</span>
        <span className="ruling-category-card__name">الكل</span>
        <span className="ruling-category-card__count">{total}</span>
      </button>

      {RULINGS_CATEGORY_TREE.map((main) => {
        const count = countFor(main.name);
        if (count === 0 && activeCategory !== main.name) return null;
        const active = activeCategory === main.name && !activeSubcategory;
        return (
          <div key={main.slug} className="ruling-category-group">
            <button
              type="button"
              className={`ruling-category-card${active ? " ruling-category-card--active" : ""}`}
              onClick={() => onSelect(main.name)}
            >
              <span className="ruling-category-card__icon">{main.icon || "📖"}</span>
              <span className="ruling-category-card__name">{main.name}</span>
              <span className="ruling-category-card__count">{count}</span>
            </button>
            {activeCategory === main.name && main.children && main.children.length > 0 && (
              <div className="ruling-subcategory-chips">
                {main.children.map((sub) => {
                  const subCount = countFor(main.name, sub.name);
                  if (subCount === 0) return null;
                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      className={`content-hub-chip${activeSubcategory === sub.name ? " content-hub-chip--active" : ""}`}
                      onClick={() => onSelect(main.name, sub.name)}
                    >
                      {sub.name} ({subCount})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
