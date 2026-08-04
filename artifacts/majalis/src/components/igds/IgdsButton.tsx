import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";

type Variant = "primary" | "secondary" | "ghost" | "accent";

type Common = {
  variant?: Variant;
  iconOnly?: boolean;
  block?: boolean;
  children: ReactNode;
  className?: string;
};

type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = Common & { href: string; onClick?: () => void; "aria-label"?: string };

function cls(variant: Variant, iconOnly?: boolean, block?: boolean, className?: string) {
  return [
    "igds-btn",
    `igds-btn--${variant}`,
    iconOnly ? "igds-btn--icon" : "",
    block ? "igds-btn--block" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function IgdsButton(props: AsButton | AsLink) {
  const { variant = "primary", iconOnly, block, className, children } = props;
  const classNames = cls(variant, iconOnly, block, className);
  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classNames} onClick={props.onClick} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }
  const btn = props as AsButton;
  return (
    <button type={btn.type ?? "button"} className={classNames} disabled={btn.disabled} onClick={btn.onClick} aria-label={btn["aria-label"]}>
      {children}
    </button>
  );
}
