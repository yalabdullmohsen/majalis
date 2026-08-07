import type { LucideIcon, LucideProps } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Props = LucideProps & {
  /** Icon drawn for LTR "forward"/next; mirrored automatically in RTL when directional. */
  icon: LucideIcon;
  /**
   * directional = flip with document direction (chevrons/arrows for nav).
   * fixed = never flip (play, pause, check, logos).
   */
  orientation?: "directional" | "fixed";
  className?: string;
};

/**
 * BIDI-aware Lucide wrapper. Directional icons mirror under [dir=rtl]
 * via CSS class so LTR languages keep natural arrow orientation.
 */
export function DirectionalIcon({
  icon: Icon,
  orientation = "directional",
  className = "",
  ...rest
}: Props) {
  const { dir } = useLanguage();
  // Icons in this codebase are authored for RTL (e.g. ArrowRight = back).
  // Mirror only when the document direction is LTR.
  const cls = [
    orientation === "directional" ? "icon-directional" : "icon-fixed",
    dir === "ltr" && orientation === "directional" ? "icon-directional--ltr" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Icon className={cls} aria-hidden={rest["aria-label"] ? undefined : true} {...rest} />;
}
