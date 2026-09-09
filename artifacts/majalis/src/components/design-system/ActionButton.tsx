import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Common = {
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "md" | "sm" | "lg";
  className?: string;
  children: ReactNode;
};

type AsButton = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsLink = Common & {
  href: string;
  type?: never;
  disabled?: boolean;
};

export type ActionButtonProps = AsButton | AsLink;

const VARIANT: Record<NonNullable<Common["variant"]>, string> = {
  primary: "ss-action-btn--primary",
  secondary: "ss-action-btn--secondary",
  ghost: "ss-action-btn--ghost",
  gold: "ss-action-btn--gold",
};

/** زر إجراء موحّد — feedback خفيف عبر mj-pressable. */
export function ActionButton(props: ActionButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(
    "ss-action-btn mj-pressable",
    VARIANT[variant],
    size === "sm" && "ss-action-btn--sm",
    size === "lg" && "ss-action-btn--lg",
    className,
  );

  if ("href" in props && props.href) {
    const { href, disabled } = props;
    if (disabled) {
      return (
        <span className={cn(classes, "is-disabled")} aria-disabled="true">
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={classes} data-action-button="1">
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as AsButton;
  return (
    <button type={type} className={classes} data-action-button="1" {...rest}>
      {children}
    </button>
  );
}
