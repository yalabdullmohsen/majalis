import {
  formatHadithGradeLabel,
  hadithGradeCssClass,
  type HadithRecord,
} from "@/lib/hadith/hadithNormalize";

type Props = {
  grade: string | null;
  className?: string;
  title?: string;
};

/** شارة حكم الحديث — صيغة موحّدة. */
export function HadithGradeBadge({ grade, className = "", title }: Props) {
  const label = formatHadithGradeLabel(grade);
  const cls = hadithGradeCssClass(grade);
  return (
    <span
      className={`hadith-grade ${cls}${className ? ` ${className}` : ""}`}
      title={title ?? (grade?.trim() || undefined)}
    >
      {label}
    </span>
  );
}

export type { HadithRecord };
