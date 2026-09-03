type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** حقل بحث داخل قسم الحديث. */
export function HadithSearch({
  id = "hadith-search",
  value,
  onChange,
  placeholder = "ابحث في متن الحديث أو المصدر أو التصنيف…",
  className = "",
}: Props) {
  return (
    <label className={`hadith-toolbar__search${className ? ` ${className}` : ""}`} htmlFor={id}>
      <span className="sr-only">بحث في الأحاديث</span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="hadith-toolbar__input"
        aria-label="بحث في الأحاديث"
        autoComplete="off"
      />
    </label>
  );
}
