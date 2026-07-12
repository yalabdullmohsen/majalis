export const C = {
  ink:           "var(--majalis-ink)",
  inkSoft:       "var(--majalis-ink-soft)",
  inkMuted:      "var(--majalis-ink-muted, #52525B)",
  charcoal:      "var(--majalis-charcoal)",
  parchment:     "var(--majalis-parchment)",
  parchmentDeep: "var(--majalis-parchment-deep)",
  panel:         "var(--majalis-panel)",
  panelRaised:   "var(--majalis-panel-raised, #FDFBF7)",
  emerald:       "var(--majalis-emerald)",
  emeraldDeep:   "var(--majalis-emerald-deep)",
  emeraldSoft:   "var(--majalis-emerald-soft, #EAF5EE)",
  brass:         "var(--majalis-brass)",
  brassDeep:     "var(--majalis-brass-deep)",
  brassSoft:     "var(--majalis-brass-soft, #FDF4E0)",
  sage:          "var(--majalis-sage)",
  line:          "var(--majalis-line)",
  lineStrong:    "var(--majalis-line-strong, #D8D0C4)",
  shadow:        "var(--majalis-shadow)",
  shadowSm:      "var(--majalis-shadow-sm)",
  danger:        "var(--majalis-danger, #C0392B)",
  dangerMuted:   "var(--majalis-danger-muted, #FEF2F2)",
};

export const GOVERNORATES = [
  "العاصمة", "حولي", "الفروانية", "الجهراء", "الأحمدي", "مبارك الكبير",
];

// ─── الأسئلة والأجوبة الدينية ───────────────────────────────────────
// التصنيفات تُقرأ من جدول qa_categories. هذا السلَج للتصنيف الذي يظهر فيه نوع الحكم.
export const QA_RULING_CATEGORY_SLUG = "rulings";

export const QA_RULING_TYPES = ["حلال", "حرام", "مكروه", "مباح", "سنة", "مندوب"];

// ألوان شارة نوع الحكم
export const QA_RULING_COLORS: Record<string, { bg: string; text: string }> = {
  "حلال": { bg: "#D1FAE5", text: "#065F46" },
  "مباح": { bg: "#DBEAFE", text: "#1E40AF" },
  "سنة": { bg: "rgba(14,110,82,0.08)", text: "#0A5040" },
  "مندوب": { bg: "rgba(14,110,82,0.08)", text: "#0A5040" },
  "مكروه": { bg: "rgba(21,48,37,0.08)", text: "#153025" },
  "حرام": { bg: "#FEE2E2", text: "#991B1B" },
};

// حالة النشر (status)
export const QA_STATUS_LABELS: Record<string, string> = { published: "منشور", draft: "مسودة" };
// درجة الاعتماد / المراجعة (review_status)
export const QA_REVIEW_LABELS: Record<string, string> = { approved: "معتمد", needs_review: "يحتاج مراجعة" };

export const QA_DISCLAIMER =
  "المحتوى علمي وتعليمي، وما يحتاج إلى فتوى خاصة يُحال إلى أهل العلم المختصين.";
