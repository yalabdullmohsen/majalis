import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReadingText } from "@/components/reading/ReadingText";
import { ContentActionBar } from "@/components/reading/ContentActionBar";
import { markReadingProgress, type ReadingSection } from "@/lib/reading-progress";
import { readPreferences } from "@/lib/user-preferences";
import type { InlineEditContentType } from "@/components/AdminInlineEdit";

export type ContentMetaItem = {
  label: string;
  value: string;
};

export type HighlightedContentCardProps = {
  id: string;
  section?: ReadingSection;
  title?: string;
  primaryText: string;
  secondaryText?: string;
  tags?: string[];
  badges?: ReactNode;
  meta?: ContentMetaItem[];
  repeatCount?: number;
  grade?: string;
  contentType?: string;
  contentId?: string;
  showSave?: boolean;
  shareTitle?: string;
  shareText?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  headerAsButton?: boolean;
  footnote?: ReactNode;
  extra?: ReactNode;
  showPrint?: boolean;
  showImageCard?: boolean;
  imageCardCategory?: string;
  imageCardSource?: string;
  trackProgress?: boolean;
  className?: string;
  /** لتفعيل زر التعديل المباشر للمشرفين */
  adminEditType?: InlineEditContentType;
  adminEditData?: Record<string, unknown>;
};

export function HighlightedContentCard({
  id,
  section,
  title,
  primaryText,
  secondaryText,
  tags = [],
  badges,
  meta = [],
  repeatCount,
  grade,
  contentType,
  contentId,
  showSave = false,
  shareTitle,
  shareText,
  collapsible = false,
  defaultOpen = true,
  headerAsButton = false,
  footnote,
  extra,
  showPrint = false,
  showImageCard = false,
  imageCardCategory,
  imageCardSource,
  trackProgress = true,
  className = "",
  adminEditType,
  adminEditData,
}: HighlightedContentCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [localReading, setLocalReading] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const globalReading = readPreferences().readingMode;
  const readingActive = localReading || globalReading;

  useEffect(() => {
    if (!trackProgress || !section || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.45)) {
          markReadingProgress(section, { id, title: title || primaryText.slice(0, 48) });
        }
      },
      { threshold: [0.45] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, section, title, primaryText, trackProgress]);

  const bodyVisible = !collapsible || open;
  const sharePayload = shareText || (secondaryText ? `${primaryText}\n\n${secondaryText}` : primaryText);

  const headerContent = (
    <>
      <div className="highlighted-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="page-tag">{tag}</span>
        ))}
        {repeatCount != null && repeatCount > 0 && (
          <span className="highlighted-card__repeat">× {repeatCount}</span>
        )}
        {grade && <span className="highlighted-card__grade">{grade}</span>}
        {badges}
      </div>
      {title && !secondaryText && (
        <h3 className="highlighted-card__title">{title}</h3>
      )}
    </>
  );

  return (
    <article
      ref={ref}
      id={`content-${id}`}
      className={`ui-card highlighted-content-card${open ? " highlighted-content-card--open" : ""}${readingActive ? " highlighted-content-card--reading" : ""} ${className}`.trim()}
      data-content-id={id}
    >
      {collapsible && headerAsButton ? (
        <button
          type="button"
          className="highlighted-card__head-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <ReadingText className="highlighted-card__question">{primaryText}</ReadingText>
          <div className="highlighted-card__head-meta">{headerContent}</div>
        </button>
      ) : (
        <header className="highlighted-card__head">{headerContent}</header>
      )}

      {bodyVisible && (
        <div className="highlighted-card__body">
          <div
            className={`highlighted-card__highlight${readingActive ? " highlighted-card__highlight--quiet" : ""}`}
          >
            {collapsible && headerAsButton ? (
              secondaryText && <ReadingText className="highlighted-card__answer">{secondaryText}</ReadingText>
            ) : (
              <ReadingText className="highlighted-card__text">{primaryText}</ReadingText>
            )}
            {!collapsible && secondaryText && (
              <ReadingText className="highlighted-card__secondary">{secondaryText}</ReadingText>
            )}
          </div>

          {meta.length > 0 && (
            <dl className="highlighted-card__meta">
              {meta.map((m) => (
                <div key={`${m.label}-${m.value}`}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {footnote}

          {extra}

          <ContentActionBar
            text={sharePayload}
            title={shareTitle || title || tags[0] || "محتوى"}
            contentType={contentType}
            contentId={contentId}
            showSave={showSave}
            showPrint={showPrint}
            showImageCard={showImageCard}
            imageCardCategory={imageCardCategory}
            imageCardSource={imageCardSource}
            adminEdit={adminEditType && contentId ? { contentType: adminEditType, initialData: adminEditData } : undefined}
          />

          <button
            type="button"
            className="highlighted-card__local-reading"
            onClick={() => setLocalReading((v) => !v)}
            aria-pressed={localReading}
          >
            {localReading ? "إيقاف وضع القراءة للبطاقة" : "تفعيل وضع القراءة للبطاقة"}
          </button>
        </div>
      )}

      {collapsible && !headerAsButton && (
        <button type="button" className="highlighted-card__toggle" onClick={() => setOpen((v) => !v)}>
          {open ? "إخفاء" : "عرض"}
        </button>
      )}
    </article>
  );
}

export default HighlightedContentCard;
