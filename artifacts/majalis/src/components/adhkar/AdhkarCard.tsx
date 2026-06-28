import { useEffect, useRef, useState } from "react";
import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { AdhkarMinimalCounter } from "@/components/adhkar/AdhkarMinimalCounter";
import { ContentActionBar } from "@/components/reading/ContentActionBar";
import { ReadingText } from "@/components/reading/ReadingText";
import { markReadingProgress } from "@/lib/reading-progress";
import { isDemoId } from "@/lib/demo-content";

type Props = {
  item: AdhkarItem;
};

export function AdhkarCard({ item }: Props) {
  const category = ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId);
  const [readingMode, setReadingMode] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.45)) {
          markReadingProgress("adhkar", {
            id: item.id,
            title: item.text.slice(0, 48),
          });
        }
      },
      { threshold: [0.45] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id, item.text]);

  const meta = [
    item.narrator ? { label: "الراوي", value: item.narrator } : null,
    item.source ? { label: "المصدر", value: item.source } : null,
    item.reference ? { label: "المرجع", value: item.reference } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article
      ref={ref}
      id={`content-${item.id}`}
      className={`adhkar-card-v3 ui-card${readingMode ? " adhkar-card-v3--reading" : ""}`}
      data-content-id={item.id}
    >
      {!readingMode && (
        <header className="adhkar-card-v3__head">
          <div className="adhkar-card-v3__tags">
            {category && <span className="adhkar-card-v3__tag">{category.name}</span>}
            {item.count > 0 && (
              <span className="adhkar-card-v3__repeat">× {item.count}</span>
            )}
            {item.grade && (
              <span className="adhkar-card-v3__grade">{item.grade}</span>
            )}
          </div>
        </header>
      )}

      <div className="adhkar-card-v3__body">
        <ReadingText className="adhkar-card-v3__text">{item.text}</ReadingText>

        {!readingMode && meta.length > 0 && (
          <dl className="adhkar-card-v3__meta">
            {meta.map((m) => (
              <div key={`${m.label}-${m.value}`}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <footer className="adhkar-card-v3__foot">
        {!readingMode && (
          <AdhkarMinimalCounter storageId={`adhkar-${item.id}`} target={item.count} />
        )}

        {!readingMode && (
          <ContentActionBar
            text={item.text}
            title={category?.name || "ذكر"}
            contentType="adhkar"
            contentId={item.id}
            showSave={!isDemoId(item.id)}
            showReadingMode={false}
          />
        )}

        <button
          type="button"
          className="adhkar-card-v3__reading-toggle"
          onClick={() => setReadingMode((v) => !v)}
          aria-pressed={readingMode}
        >
          {readingMode ? "← العودة" : "وضع القراءة"}
        </button>
      </footer>
    </article>
  );
}

export default AdhkarCard;
