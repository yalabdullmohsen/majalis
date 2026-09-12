import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

/** ضغط لمسي فوري عبر data-pressed — بلا framer-motion. */
export function Pressable({
  children,
  className,
  type = "button",
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  ...props
}: Props) {
  const setPressed = (el: HTMLElement | null, on: boolean) => {
    if (!el) return;
    if (on) el.setAttribute("data-pressed", "1");
    else el.removeAttribute("data-pressed");
  };

  return (
    <button
      type={type}
      className={cn("mj-pressable", className)}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return;
        setPressed(e.currentTarget, true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(e.currentTarget, false);
        onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        setPressed(e.currentTarget, false);
        onPointerCancel?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(e.currentTarget, false);
        onPointerLeave?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
