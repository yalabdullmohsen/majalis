import { Link } from "wouter";

export default function QuranTajweedPage() {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "2rem auto",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        direction: "rtl",
        fontFamily: "inherit",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/quran" style={{ color: "#6b7280", fontSize: "0.85rem", textDecoration: "none" }}>
          ← القرآن الكريم
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0D1B2A" }}>
        أحكام التجويد
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "2rem" }}>
        أساسيات علم التجويد وأحكام تلاوة القرآن الكريم.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        {TAJWEED_TOPICS.map((topic) => (
          <div
            key={topic.title}
            style={{
              padding: "1rem 1.25rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              background: "#fafaf9",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0D1B2A", marginBottom: "0.4rem" }}>
              {topic.title}
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
              {topic.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAJWEED_TOPICS = [
  {
    title: "النون الساكنة والتنوين",
    description: "لها أربعة أحكام: الإظهار — الإدغام — الإقلاب — الإخفاء. يُطبَّق كلٌّ منها حسب الحرف الذي يليه.",
  },
  {
    title: "الميم الساكنة",
    description: "لها ثلاثة أحكام: الإخفاء الشفوي عند الباء — الإدغام الشفوي عند الميم — الإظهار الشفوي عند بقية الحروف.",
  },
  {
    title: "المدود",
    description: "المد الطبيعي مقداره حركتان، والمدود الفرعية (المتصل والمنفصل والعارض للسكون) تتراوح بين 2-6 حركات.",
  },
  {
    title: "الوقف والابتداء",
    description: "أنواع الوقف: التام — الكافي — الحسن — القبيح. يُنصح بالوقف عند علامات الوقف المرسومة في المصحف.",
  },
  {
    title: "التفخيم والترقيق",
    description: "حروف الاستعلاء السبعة (خص ضغط قظ) تُفخَّم دائماً. الراء واللام لهما أحكام تفخيم وترقيق تبعاً للحركة والسياق.",
  },
  {
    title: "القلقلة",
    description: "حروف القلقلة خمسة مجموعة في (قطب جد). تُقلقل عند السكون — سواء كان سكوناً أصلياً أم عارضاً للوقف.",
  },
];
