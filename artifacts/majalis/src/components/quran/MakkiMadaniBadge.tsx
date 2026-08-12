export function MakkiMadaniBadge({ revelation }: { revelation: "مكية" | "مدنية" }) {
  return <span className={`revelation-badge revelation-badge--${revelation === "مكية" ? "makki" : "madani"}`}>{revelation}</span>;
}
