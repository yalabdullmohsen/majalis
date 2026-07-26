/**
 * شارة درجة التوثيق — تعتمد trust_level من citation-schema
 * لا تستخدم documentation_level (بوابة عرض المسائل الفقهية).
 */
import "@/styles/components/content-trust.css";
import {
  TRUST_LEVEL_DEFINITIONS,
  type TrustLevel,
} from "@/lib/citation-schema";

export type { TrustLevel };

export type SourceBadgeProps = {
  trustLevel: TrustLevel;
  className?: string;
};

export function SourceBadge({ trustLevel, className }: SourceBadgeProps) {
  const def = TRUST_LEVEL_DEFINITIONS[trustLevel];
  const classes = ["ct-source-badge", `ct-source-badge--${trustLevel}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={classes}
      data-trust-level={trustLevel}
      title={def.definition}
      role="status"
    >
      {def.ar}
    </span>
  );
}

export default SourceBadge;
