import type { SinJeemQuestion } from "@/lib/sin-jeem/types";

const LETTERS = ["أ", "ب", "ج", "د"];

interface QuestionCardProps {
  question: SinJeemQuestion;
  selectedIndex: number | null;
  hiddenOptions: number[];
  revealed: boolean;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

function OrderEventsCard({
  question,
  selectedIndex,
  revealed,
  onSelect,
  disabled,
}: QuestionCardProps) {
  const options = question.options || [];
  return (
    <div className="sj-order-events">
      <p className="sj-hint">اختر الترتيب الصحيح للحدث الأول:</p>
      <div className="sj-options">
        {options.map((opt, i) => {
          let cls = "sj-option";
          if (selectedIndex === i) cls += " selected";
          if (revealed) {
            if (i === (question.correct_index ?? 0)) cls += " correct";
            else if (selectedIndex === i) cls += " wrong";
          }
          return (
            <button key={i} type="button" className={cls} disabled={disabled || revealed} onClick={() => onSelect(i)}>
              <span className="sj-option-letter">{i + 1}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchPairsCard({ question, revealed }: QuestionCardProps) {
  const options = question.options || [];
  const pairs = options.reduce<string[][]>((acc, _, i, arr) => {
    if (i % 2 === 0 && arr[i + 1]) acc.push([arr[i], arr[i + 1]]);
    return acc;
  }, []);
  return (
    <div className="sj-match-pairs">
      {pairs.map(([a, b], i) => (
        <div key={i} className="sj-match-row">
          <span>{a}</span>
          <span className="sj-match-arrow">↔</span>
          <span>{b}</span>
        </div>
      ))}
      {revealed && question.explanation && <p className="sj-explanation">💡 {question.explanation}</p>}
    </div>
  );
}

function ImageChoiceCard(props: QuestionCardProps) {
  const { question, selectedIndex, hiddenOptions, revealed, onSelect, disabled } = props;
  return (
    <div className="sj-image-choice">
      {question.image_url && (
        <img src={question.image_url} alt="" className="sj-question-image" loading="lazy" />
      )}
      <div className="sj-options">
        {(question.options || []).map((opt, i) => {
          if (hiddenOptions.includes(i)) return null;
          let cls = "sj-option";
          if (selectedIndex === i) cls += " selected";
          if (revealed) {
            if (i === (question.correct_index ?? 0)) cls += " correct";
            else if (selectedIndex === i) cls += " wrong";
          }
          return (
            <button key={i} type="button" className={cls} disabled={disabled || revealed} onClick={() => onSelect(i)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuestionCard(props: QuestionCardProps) {
  const { question, selectedIndex, hiddenOptions, revealed, onSelect, disabled } = props;
  const options = question.options || [];
  const type = question.question_type;

  const isComplete =
    type === "complete_verse" || type === "complete_hadith" || type.startsWith("complete_");

  return (
    <div className="sj-question-card">
      <div className="sj-question-meta">
        {question.category_slug && <span className="sj-badge">{question.category_slug}</span>}
        {question.subcategory_slug && <span className="sj-badge">{question.subcategory_slug}</span>}
        <span className="sj-badge">{question.difficulty}</span>
        <span className="sj-badge">{type.replace(/_/g, " ")}</span>
        {question.source && <span className="sj-badge sj-badge--source">{question.source}</span>}
      </div>

      <p className={`sj-question-text${isComplete ? " sj-question-text--complete" : ""}`}>
        {question.question}
      </p>

      {type === "order_events" && <OrderEventsCard {...props} />}
      {type === "match" && <MatchPairsCard {...props} />}
      {(type === "image_choice" || type === "mosque_choice") && <ImageChoiceCard {...props} />}

      {type !== "order_events" && type !== "match" && type !== "image_choice" && type !== "mosque_choice" && (
        <div className="sj-options">
          {options.map((opt, i) => {
            if (hiddenOptions.includes(i)) return null;
            let cls = "sj-option";
            if (selectedIndex === i) cls += " selected";
            if (revealed) {
              if (i === (question.correct_index ?? 0)) cls += " correct";
              else if (selectedIndex === i) cls += " wrong";
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={disabled || revealed}
                onClick={() => onSelect(i)}
              >
                <span className="sj-option-letter">{LETTERS[i] || i + 1}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {revealed && question.explanation && type !== "match" && (
        <p className="sj-explanation">💡 {question.explanation}</p>
      )}
    </div>
  );
}
