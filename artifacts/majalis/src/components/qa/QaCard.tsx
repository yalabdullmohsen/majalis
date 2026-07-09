import { displayText } from "@/lib/display-text";
import { isDemoId } from "@/lib/demo-content";
import { HighlightedContentCard } from "@/components/reading/HighlightedContentCard";
import { getQaViewCount } from "@/lib/qa-utils";

const QA_RULING_MOD: Record<string, string> = {
  "حلال":  "qa-ruling--halal",
  "مباح":  "qa-ruling--mubah",
  "سنة":   "qa-ruling--sunna",
  "مندوب": "qa-ruling--mandub",
  "مكروه": "qa-ruling--makruh",
  "حرام":  "qa-ruling--haram",
};

function RulingBadge({ ruling }: { ruling: string }) {
  return (
    <span className={`qa-badge ${QA_RULING_MOD[ruling] ?? ""}`}>
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

  return (
    <HighlightedContentCard
      id={item.id}
      section="qa"
      primaryText={question}
      secondaryText={answer}
      tags={catName ? [catName] : []}
      badges={item.ruling_type ? <RulingBadge ruling={item.ruling_type} /> : undefined}
      meta={[
        { label: "المشاهدات", value: `${getQaViewCount(item)}` },
        ...(item.reference ? [{ label: "المرجع", value: displayText(item.reference) }] : []),
      ]}
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
      adminEditType="qa"
      adminEditData={{ question: item.question, answer: item.answer || "", category: catName || "" }}
    />
  );
}

export default QaCard;
