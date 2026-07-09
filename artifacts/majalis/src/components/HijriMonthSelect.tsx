import { HIJRI_MONTHS } from "@/lib/hijri-utils";

export type HijriMonthSelectProps = {
  /** رقم الشهر 1..12، أو "" لخيار "كل الأشهر" */
  value: number | "";
  onChange: (value: number | "") => void;
  /** إضافة خيار "كل الأشهر" في الأعلى (مناسب للفلاتر) */
  includeAll?: boolean;
  allLabel?: string;
  /** إظهار مؤشر ⭐ بجانب الأشهر الحُرُم */
  markSacred?: boolean;
  id?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  disabled?: boolean;
};

/**
 * قائمة اختيار الأشهر الهجرية — مرتّبة حسب ترتيبها الصحيح (1..12) لا أبجدياً،
 * مع مؤشر للأشهر الحُرُم. مصدر موحّد للنماذج والفلاتر والجداول.
 */
export function HijriMonthSelect({
  value,
  onChange,
  includeAll = false,
  allLabel = "كل الأشهر",
  markSacred = true,
  id,
  name,
  className,
  style,
  disabled,
  ...rest
}: HijriMonthSelectProps) {
  return (
    <select
      id={id}
      name={name}
      className={className}
      style={style}
      disabled={disabled}
      aria-label={rest["aria-label"] ?? "اختر الشهر الهجري"}
      value={value === "" ? "" : String(value)}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? "" : Number(v));
      }}
    >
      {includeAll && <option value="">{allLabel}</option>}
      {HIJRI_MONTHS.map((m) => (
        <option key={m.number} value={m.number}>
          {markSacred && m.sacred ? `${m.name} ⭐` : m.name}
        </option>
      ))}
    </select>
  );
}

export default HijriMonthSelect;
