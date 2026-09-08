import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  /** اهتزاز خفيف عند الضغط (Capacitor أو vibrate(8) على الويب). */
  haptic?: boolean;
};

/** زر بضغط لمسي فوري (CSS spring) + هدف لمس ≥44px — بلا framer-motion. */
export function Pressable({
  children,
  className,
  type = "button",
  haptic = true,
  onPointerDown,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn("mj-pressable mj-touch-target", className)}
      onPointerDown={(e) => {
        if (haptic && !props.disabled) triggerHaptic("light");
        onPointerDown?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
