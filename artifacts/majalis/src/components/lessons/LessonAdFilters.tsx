import type { LessonAdFilters } from "@/lib/lesson-ads";

type Options = {
  teachers: string[];
  venues: string[];
  districts: string[];
  days: string[];
  categories: string[];
};

type Props = {
  filters: LessonAdFilters;
  options: Options;
  onChange: (filters: LessonAdFilters) => void;
};

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="cl-filter">
      <span>{label}</span>
      <select value={value || "الكل"} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LessonAdFilters({ filters, options, onChange }: Props) {
  return (
    <div className="cl-filters">
      <Select
        label="الشيخ"
        value={filters.teacher || "الكل"}
        options={options.teachers}
        onChange={(teacher) => onChange({ ...filters, teacher })}
      />
      <Select
        label="المسجد"
        value={filters.venue || "الكل"}
        options={options.venues}
        onChange={(venue) => onChange({ ...filters, venue })}
      />
      <Select
        label="المنطقة"
        value={filters.district || "الكل"}
        options={options.districts}
        onChange={(district) => onChange({ ...filters, district })}
      />
      <Select
        label="اليوم"
        value={filters.day || "الكل"}
        options={options.days}
        onChange={(day) => onChange({ ...filters, day })}
      />
      <Select
        label="النوع"
        value={filters.category || "الكل"}
        options={options.categories}
        onChange={(category) => onChange({ ...filters, category })}
      />
    </div>
  );
}
