import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ActionButton, type ActionButtonProps } from "./ActionButton";
import { cn } from "@/lib/utils";

/** زر أساسي — أخضر عميق / نعناعي ليلي. */
export function PrimaryButton(props: ActionButtonProps) {
  return <ActionButton {...props} variant="primary" />;
}

/** زر ثانوي — سطح + حد أخضر. */
export function SecondaryButton(props: ActionButtonProps) {
  return <ActionButton {...props} variant="secondary" />;
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: "brand" | "muted" | "gold";
};

/** زر أيقونة دائري — للرجوع/إغلاق/إجراء سريع. */
export function IconButton({
  label,
  children,
  tone = "brand",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "ss-icon-btn mj-pressable",
        tone === "muted" && "ss-icon-btn--muted",
        tone === "gold" && "ss-icon-btn--gold",
        className,
      )}
      data-icon-button="1"
      {...rest}
    >
      {children}
    </button>
  );
}
