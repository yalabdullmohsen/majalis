import {
  createElement,
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  SS_TEXT_DEFAULT_TAG,
  SS_TEXT_ROLE_CLASS,
  type SsTextRole,
} from "@/lib/ssunnah-theme";

export type SsTextTone = "default" | "muted" | "brand" | "onBrand";

export type SsTextProps = HTMLAttributes<HTMLElement> & {
  /** الدور الدلالي — منفصل عن aria-role */
  variant?: SsTextRole;
  /** عنصر HTML — الافتراضي حسب الدور (h1/h2/p/…) */
  as?: ElementType;
  tone?: SsTextTone;
  children?: ReactNode;
};

const TONE_CLASS: Record<SsTextTone, string | undefined> = {
  default: undefined,
  muted: "ss-text--muted",
  brand: "ss-text--brand",
  onBrand: "ss-text--on-brand",
};

/**
 * نص سُنّة الموحّد — يعتمد على `ssunnah-theme-api.css` فقط.
 * لا تستخدم عناصر نص خام في الشاشات الجديدة؛ مرّ عبر الأدوار المصدّرة أدناه.
 */
export const SsText = forwardRef<HTMLElement, SsTextProps>(function SsText(
  { variant = "body", as, tone = "default", className, children, ...rest },
  ref,
) {
  const Tag = (as ?? SS_TEXT_DEFAULT_TAG[variant]) as ElementType;
  return createElement(
    Tag,
    {
      ...rest,
      ref,
      className: cn(SS_TEXT_ROLE_CLASS[variant], TONE_CLASS[tone], className),
      "data-ss-text": variant,
    },
    children,
  );
});

function makeRole(variant: SsTextRole, displayName: string) {
  const Comp = forwardRef<HTMLElement, Omit<SsTextProps, "variant">>(function RoleText(props, ref) {
    return <SsText ref={ref} variant={variant} {...props} />;
  });
  Comp.displayName = displayName;
  return Comp;
}

export const ScreenTitle = makeRole("screenTitle", "ScreenTitle");
export const SectionTitle = makeRole("sectionTitle", "SectionTitle");
export const CardTitle = makeRole("cardTitle", "CardTitle");
export const BodyText = makeRole("body", "BodyText");
export const ScriptureText = makeRole("scripture", "ScriptureText");
export const ExplanationText = makeRole("explanation", "ExplanationText");
export const SupportingText = makeRole("supporting", "SupportingText");
export const LabelText = makeRole("label", "LabelText");
export const Caption = makeRole("caption", "Caption");
