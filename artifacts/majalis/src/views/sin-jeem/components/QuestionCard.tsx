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

export function QuestionCard({
  question,
  selectedIndex,
  hiddenOptions,
  revealed,
  onSelect,
  disabled,
}: QuestionCardProps) {
  const options = question.options || [];

  return (
    <div className="sj-question-card">
      <div className="sj-question-meta">
        {question.category_slug && <span className="sj-badge">{question.category_slug}</span>}
        <span className="sj-badge">{question.difficulty}</span>
        <span className="sj-badge">{question.question_type.replace(/_/g, " ")}</span>
      </div>
      <p className="sj-question-text">{question.question}</p>
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
      {revealed && question.explanation && (
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--majalis-ink-soft)", lineHeight: 1.6 }}>
          💡 {question.explanation}
        </p>
      )}
    </div>
  );
}
