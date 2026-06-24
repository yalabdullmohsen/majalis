import type { LessonFilters } from "@/lib/current-lessons";

type Options = {
  sheikhs: string[];
  mosques: string[];
  regions: string[];
  days: string[];
};

type Props = {
  filters: LessonFilters;
  options: Options;
  onChange: (filters: LessonFilters) => void;
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
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CurrentLessonsFilters({ filters, options, onChange }: Props) {
  return (
    <div className="cl-filters">
      <Select
        label="الشيخ"
        value={filters.sheikh || "الكل"}
        options={options.sheikhs}
        onChange={(sheikh) => onChange({ ...filters, sheikh })}
      />
      <Select
        label="المسجد"
        value={filters.mosque || "الكل"}
        options={options.mosques}
        onChange={(mosque) => onChange({ ...filters, mosque })}
      />
      <Select
        label="المنطقة"
        value={filters.region || "الكل"}
        options={options.regions}
        onChange={(region) => onChange({ ...filters, region })}
      />
      <Select
        label="اليوم"
        value={filters.day || "الكل"}
        options={options.days}
        onChange={(day) => onChange({ ...filters, day })}
      />
    </div>
  );
}
