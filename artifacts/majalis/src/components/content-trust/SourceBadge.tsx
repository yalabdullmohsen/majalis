/**
 * شارة درجة التوثيق — ملف جديد فقط.
 * لا يُدمج قبل اكتمال أعمال الواجهة (انظر docs/deferred-ui/INTEGRATION.md).
 *
 * يعتمد على trust_level — لا على documentation_level (بوابة عرض الفقه).
 * بعد دمج فرع المحتوى يمكن استبدال النوع المحلي باستيراد من citation-schema.
 */

export type TrustLevel =
  | "primary_text"
  | "scholarly_source"
  | "institutional_ruling"
  | "general_reasoning"
  | "unsourced";

const LABEL: Record<TrustLevel, string> = {
  primary_text: "نص أصلي",
  scholarly_source: "مصدر علمي",
  institutional_ruling: "قرار مؤسسي",
  general_reasoning: "استدلال عام",
  unsourced: "بلا مصدر",
};

const DEFINITION: Record<TrustLevel, string> = {
  primary_text: "نص قرآني بسورة ورقم آية، أو حديث بمصنَّف ورقم وحكم وحاكم.",
  scholarly_source: "نقل عن عالم أو كتاب مسمّى بجزء وصفحة.",
  institutional_ruling: "قرار مجمع أو هيئة برقم وتاريخ.",
  general_reasoning: "استدلال بقاعدة عامة بلا نص مسمّى.",
  unsourced: "بلا شيء يمكن التحقق منه.",
};

export type SourceBadgeProps = {
  trustLevel: TrustLevel;
  className?: string;
};

/** عرض فقط — التنسيق النهائي مع نظام التصميم عند الدمج. */
export function SourceBadge({ trustLevel, className }: SourceBadgeProps) {
  return (
    <span
      className={className}
      data-trust-level={trustLevel}
      title={DEFINITION[trustLevel]}
      role="status"
    >
      {LABEL[trustLevel]}
    </span>
  );
}

export default SourceBadge;
