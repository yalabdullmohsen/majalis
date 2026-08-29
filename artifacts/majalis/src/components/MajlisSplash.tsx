import type { SVGProps } from "react";
import MajlisWordmark from "@/components/brand/MajlisWordmark";

type Props = {
  className?: string;
  wordmarkProps?: SVGProps<SVGSVGElement>;
};

/**
 * وردمارك دخولية «سُنّة» — نفس مكوّن العلامة دون مسار SVG للاسم القديم.
 */
export function MajlisSplashWordmark({ className, wordmarkProps }: Props) {
  return <MajlisWordmark className={className} {...wordmarkProps} />;
}
