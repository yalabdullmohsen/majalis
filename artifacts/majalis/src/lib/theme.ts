export const C = {
  ink: "#241F18",
  inkSoft: "#5B5446",
  parchment: "#FAF5EA",
  parchmentDeep: "#F0E8D6",
  panel: "#FFFFFF",
  emerald: "#1F6E54",
  emeraldDeep: "#164E3C",
  brass: "#B08D2E",
  brassDeep: "#8A6D1E",
  sage: "#CFE0D3",
  line: "#E0D7C4",
};

export const GOVERNORATES = [
  "العاصمة", "حولي", "الفروانية", "الجهراء", "الأحمدي", "مبارك الكبير",
];

// ─── الأسئلة والأجوبة الدينية ───────────────────────────────────────
export const QA_CATEGORIES = [
  "أحكام شرعية",
  "قصص الأنبياء",
  "سير الصالحين",
  "السيرة النبوية",
  "الصحابة",
  "ألغاز فقهية",
];

// التصنيف الوحيد الذي يظهر فيه نوع الحكم
export const QA_RULING_CATEGORY = "أحكام شرعية";

export const QA_RULING_TYPES = ["حلال", "حرام", "مكروه", "مباح", "سنة", "مندوب"];

// ألوان شارة نوع الحكم
export const QA_RULING_COLORS: Record<string, { bg: string; text: string }> = {
  "حلال": { bg: "#D1FAE5", text: "#065F46" },
  "مباح": { bg: "#DBEAFE", text: "#1E40AF" },
  "سنة": { bg: "#FEF3C7", text: "#92400E" },
  "مندوب": { bg: "#FEF3C7", text: "#92400E" },
  "مكروه": { bg: "#FFEDD5", text: "#9A3412" },
  "حرام": { bg: "#FEE2E2", text: "#991B1B" },
};

// درجة الاعتماد
export const QA_RELIABILITY = ["معتمد", "يحتاج مراجعة"];
export const QA_DISCLAIMER =
  "المحتوى علمي وتعليمي، وما يحتاج إلى فتوى خاصة يُحال إلى أهل العلم المختصين.";
