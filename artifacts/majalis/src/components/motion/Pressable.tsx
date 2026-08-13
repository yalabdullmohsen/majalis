import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
};

/** زر بضغط لمسي فوري (CSS spring) — بلا framer-motion. */
export function Pressable({ children, className, type = "button", ...props }: Props) {
  return (
    <button type={type} className={cn("mj-pressable", className)} {...props}>
      {children}
    </button>
  );
}
