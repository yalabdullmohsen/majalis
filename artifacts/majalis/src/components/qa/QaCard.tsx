import { displayText } from "@/lib/display-text";
import { isDemoId } from "@/lib/demo-content";
import { C, QA_RULING_COLORS } from "@/lib/theme";
import { HighlightedContentCard } from "@/components/reading/HighlightedContentCard";
import { getQaViewCount } from "@/lib/qa-utils";

function RulingBadge({ ruling }: { ruling: string }) {
  const c = QA_RULING_COLORS[ruling] || { bg: C.parchmentDeep, text: C.inkSoft };
  return (
    <span className="qa-badge" style={{ background: c.bg, color: c.text }}>
      {ruling}
    </span>
  );
}

type Props = {
  item: {
    id: string;
    question: string;
    answer?: string | null;
    ruling_type?: string;
    evidence?: string;
    reference?: string;
    qa_categories?: { name?: string };
  };
  defaultOpen?: boolean;
};

export function QaCard({ item, defaultOpen = false }: Props) {
  const catName = item.qa_categories?.name;
  const question = displayText(item.question);
  const answer = displayText(item.answer || "");

  const meta = [
    { label: "المشاهدات", value: `${getQaViewCount(item)}`, role: "date" as const },
    ...(item.reference ? [{ label: "المرجع", value: displayText(item.reference), role: "reference" as const }] : []),
  ];

  return (
    <HighlightedContentCard
      id={item.id}
      section="qa"
      primaryText={question}
      secondaryText={answer}
      tags={catName ? [catName] : []}
      badges={item.ruling_type ? <RulingBadge ruling={item.ruling_type} /> : undefined}
      meta={meta}
      footnote={
        item.evidence ? (
          <div className="qa-card__evidence">
            <strong>الدليل:</strong> {displayText(item.evidence)}
          </div>
        ) : undefined
      }
      contentType="qa"
      contentId={item.id}
      showSave={!isDemoId(item.id)}
      shareTitle={question}
      shareText={`${question}\n\n${answer}`}
      collapsible
      defaultOpen={defaultOpen}
      headerAsButton
      className="qa-card"
    />
  );
}

export default QaCard;
