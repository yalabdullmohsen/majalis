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

/** شارة حكم الحديث — صيغة موحّدة. تُخفى عند غياب حكم عام (لا تعرض حالات تحريرية). */
export function HadithGradeBadge({ grade, className = "", title }: Props) {
  const label = formatHadithGradeLabel(grade);
  if (!label) return null;
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
