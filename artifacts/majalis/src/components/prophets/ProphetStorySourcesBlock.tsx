/**
 * كتلة مصادر القصة — يعرض الموجود فقط بلا اختراع.
 */
type SourceItem = {
  label: string;
  detail?: string;
};

type Props = {
  sources: SourceItem[];
  onCopy?: (text: string) => void;
};

export function ProphetStorySourcesBlock({ sources, onCopy }: Props) {
  if (!sources.length) {
    return (
      <div className="prophet-sources-block" data-component="ProphetStorySourcesBlock" data-empty="1">
        <p className="prophet-sources-block__empty">لا مصادر معتمدة معروضة لهذا القسم حاليًا.</p>
      </div>
    );
  }

  return (
    <div className="prophet-sources-block" data-component="ProphetStorySourcesBlock" data-testid="prophet-sources-block">
      <ul className="prophet-sources-block__list">
        {sources.map((s) => {
          const copyText = [s.label, s.detail].filter(Boolean).join(" — ");
          return (
            <li key={copyText} className="prophet-sources-block__item">
              <div className="prophet-sources-block__body">
                <strong className="prophet-sources-block__label">{s.label}</strong>
                {s.detail ? <span className="prophet-sources-block__detail">{s.detail}</span> : null}
              </div>
              {onCopy ? (
                <button
                  type="button"
                  className="prophet-sources-block__copy mj-pressable"
                  onClick={() => onCopy(copyText)}
                  aria-label={`نسخ المرجع: ${s.label}`}
                >
                  نسخ
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
