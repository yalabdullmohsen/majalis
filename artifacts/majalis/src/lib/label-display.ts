/**
 * عرض تسميات عامة للمستخدم — يخفي المفاتيح التقنية (blocked:/risky:/ci…).
 * الأنظمة الداخلية تحتفظ بالاسم التقني عبر `technicalLabel` / `raw`.
 */

export type BadgeTone = "critical" | "warning" | "info" | "ui" | "neutral" | "accent";

export type PublicLabel = {
  /** النص الظاهر للمستخدم النهائي */
  publicLabel: string;
  /** المفتاح التقني الداخلي (أتمتة / GitHub / سجلات) */
  technicalLabel: string;
  tone: BadgeTone;
};

const PUBLIC_LABEL_MAP: Record<string, Omit<PublicLabel, "technicalLabel">> = {
  "blocked:danger-path": { publicLabel: "يتطلب مراجعة", tone: "critical" },
  "blocked:danger_path": { publicLabel: "يتطلب مراجعة", tone: "critical" },
  "risky:manual-review": { publicLabel: "مراجعة مطلوبة", tone: "warning" },
  "risky:manual_review": { publicLabel: "مراجعة مطلوبة", tone: "warning" },
  "manual-review": { publicLabel: "مراجعة مطلوبة", tone: "warning" },
  "no-auto-merge": { publicLabel: "دمج يدوي", tone: "critical" },
  "no-deploy": { publicLabel: "إيقاف نشر", tone: "critical" },
  hold: { publicLabel: "معلّق", tone: "warning" },
  ci: { publicLabel: "تكامل مستمر", tone: "info" },
  docs: { publicLabel: "توثيق", tone: "info" },
  ios: { publicLabel: "تطبيق iOS", tone: "info" },
  ui: { publicLabel: "واجهة", tone: "ui" },
  perf: { publicLabel: "أداء", tone: "warning" },
  "safe:auto-merge": { publicLabel: "دمج آمن", tone: "neutral" },
  "safe:ui": { publicLabel: "واجهة آمنة", tone: "ui" },
  "safe:content": { publicLabel: "محتوى آمن", tone: "info" },
  "safe:test": { publicLabel: "اختبارات آمنة", tone: "info" },
  "release-train-ready": { publicLabel: "قطار إصدار", tone: "info" },
};

/** يحوّل وسمًا تقنيًا إلى نص عربي للمستخدم النهائي. */
export function toPublicLabel(raw: string): PublicLabel {
  const technicalLabel = String(raw || "").trim();
  const key = technicalLabel.toLowerCase();
  const mapped = PUBLIC_LABEL_MAP[key] ?? PUBLIC_LABEL_MAP[technicalLabel];
  if (mapped) {
    return { technicalLabel, publicLabel: mapped.publicLabel, tone: mapped.tone };
  }
  // لا تعرض مفاتيح تقنية خام (prefix:suffix) للمستخدم
  if (/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(technicalLabel)) {
    const [, suffix] = technicalLabel.split(":");
    return {
      technicalLabel,
      publicLabel: humanizeToken(suffix || technicalLabel),
      tone: "neutral",
    };
  }
  return {
    technicalLabel,
    publicLabel: technicalLabel,
    tone: "neutral",
  };
}

function humanizeToken(token: string): string {
  const t = token.replace(/[-_]+/g, " ").trim();
  const known: Record<string, string> = {
    "danger path": "يتطلب مراجعة",
    "manual review": "مراجعة مطلوبة",
    "auto merge": "دمج تلقائي",
  };
  return known[t.toLowerCase()] || t;
}

/** للاستخدام في الواجهات العامة فقط — لا تُرجع الاسم التقني. */
export function publicLabelText(raw: string): string {
  return toPublicLabel(raw).publicLabel;
}

export function publicLabelTone(raw: string): BadgeTone {
  return toPublicLabel(raw).tone;
}
