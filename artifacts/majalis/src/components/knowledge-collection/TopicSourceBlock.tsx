type Props = {
  label?: string;
  text: string;
};

export function TopicSourceBlock({ label = "المصدر", text }: Props) {
  if (!text.trim()) return null;
  return (
    <aside className="kc-source" aria-label={label}>
      <p className="kc-source__label">{label}</p>
      <p className="kc-source__text">{text}</p>
    </aside>
  );
}
