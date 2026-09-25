/**
 * تبويبات قراءة قصة النبي — RTL · قابل للتمرير · هدف لمس ≥44×44.
 * الحالة المختارة: لون + حد + مؤشر — لا تعتمد على اللون وحده.
 */
export type ProphetStoryTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: ProphetStoryTab[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ProphetStoryTabs({ tabs, activeId, onSelect }: Props) {
  if (!tabs.length) return null;

  return (
    <nav
      className="prophet-story-tabs prophet-detail-toc"
      data-component="ProphetStoryTabs"
      data-testid="prophet-story-tabs"
      aria-label="أقسام القصة"
    >
      <div className="prophet-story-tabs__track" role="tablist" aria-orientation="horizontal">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`prophet-tab-${tab.id}`}
              className={`prophet-story-tabs__btn prophet-detail-toc__btn${active ? " prophet-story-tabs__btn--active prophet-detail-toc__btn--active" : ""}`}
              aria-selected={active}
              aria-current={active ? "true" : undefined}
              tabIndex={active ? 0 : -1}
              data-tab-id={tab.id}
              data-active={active ? "1" : "0"}
              onClick={() => onSelect(tab.id)}
            >
              <span className="prophet-story-tabs__label">{tab.label}</span>
              {active ? (
                <span className="prophet-story-tabs__marker" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
