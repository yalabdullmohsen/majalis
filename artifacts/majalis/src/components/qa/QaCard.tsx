import { useState } from "react";
import { displayText } from "@/lib/display-text";
import { isDemoId } from "@/lib/demo-content";
import { C, QA_RULING_COLORS } from "@/lib/theme";
import { ReadingToolbar } from "@/components/reading/ReadingToolbar";
import { ReadingText } from "@/components/reading/ReadingText";
import { getQaViewCount } from "@/lib/qa-utils";
import { useTrackActivity } from "@/components/UserActivityProvider";
import { ContentSuggestions } from "@/components/platform/ContentSuggestions";

function RulingBadge({ ruling }: { ruling: string }) {
  const c = QA_RULING_COLORS[ruling] || { bg: C.parchmentDeep, text: C.inkSoft };
  return (
    <span className="qa-badge" style={{ background: c.bg, color: c.text }}>
      {ruling}
    </span>
  );
}

type Props = {
  item: any;
  defaultOpen?: boolean;
};

export function QaCard({ item, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const track = useTrackActivity();
  const catName = item.qa_categories?.name;
  const question = displayText(item.question);
  const answer = displayText(item.answer);
  const shareText = `${question}\n\n${answer}`;

  const toggleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next) {
        track({
          kind: "qa",
          id: String(item.id),
          title: question.slice(0, 80),
          href: `/qa?q=${encodeURIComponent(question.slice(0, 40))}`,
          meta: catName,
        });
      }
      return next;
    });
  };

  return (
    <article className={`ui-card qa-card${open ? " qa-card--open" : ""}`}>
      <button
        type="button"
        className="qa-card__head"
        onClick={toggleOpen}
        aria-expanded={open}
      >
        <ReadingText readingMode={false} className="qa-card__question">
          {question}
        </ReadingText>
        <div className="qa-card__meta-row">
          {catName && <span className="page-tag">{catName}</span>}
          {item.ruling_type && <RulingBadge ruling={item.ruling_type} />}
          <span className="qa-card__views">{getQaViewCount(item)} مشاهدة</span>
          <span className="qa-card__toggle-hint">{open ? "إخفاء الإجابة" : "عرض الإجابة"}</span>
        </div>
      </button>

      {open && (
        <div className="qa-card__body reading-surface-target">
          <ReadingText readingMode className="qa-card__answer">
            {answer}
          </ReadingText>
          {item.evidence && (
            <div className="qa-card__evidence">
              <strong>الدليل:</strong> {displayText(item.evidence)}
            </div>
          )}
          {item.reference && (
            <p className="qa-card__ref">
              <strong>المرجع:</strong> {displayText(item.reference)}
            </p>
          )}
          <ReadingToolbar
            text={shareText}
            title={question}
            contentType="qa"
            contentId={item.id}
            showSave={!isDemoId(item.id)}
          />
          <ContentSuggestions
            keywords={[catName, item.ruling_type].filter(Boolean) as string[]}
            category={catName}
          />
        </div>
      )}
    </article>
  );
}

export default QaCard;
