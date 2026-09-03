import { ExclusiveChoiceGroup } from "@/components/ui/ExclusiveChoiceGroup";
import {
  HADITH_GRADE_FILTER_OPTIONS,
  type HadithGradeFilter,
} from "@/lib/hadith/hadithFilters";

type Props = {
  value: HadithGradeFilter;
  onChange: (value: HadithGradeFilter) => void;
  className?: string;
  /** إخفاء فلتر الضعيف في السياقات العامة */
  hideWeak?: boolean;
};

/** فلاتر حكم الحديث: الكل · الصحيح · الحسن · الضعيف */
export function HadithFilters({ value, onChange, className = "", hideWeak = false }: Props) {
  const items = hideWeak
    ? HADITH_GRADE_FILTER_OPTIONS.filter((o) => o.id !== "daif")
    : [...HADITH_GRADE_FILTER_OPTIONS];

  return (
    <div className={`hadith-grade-filters${className ? ` ${className}` : ""}`}>
      <p className="hadith-filter-label">الحكم</p>
      <ExclusiveChoiceGroup
        ariaLabel="تصفية حكم الحديث"
        value={value}
        onChange={(id) => onChange(id as HadithGradeFilter)}
        items={items}
      />
    </div>
  );
}
