import type { SVGProps } from "react";
import {
  MAJLIS_WORDMARK_PATH,
  MAJLIS_WORDMARK_VIEWBOX,
} from "@/lib/majlis-wordmark-path";
import { SPLASH_TAGLINE } from "@/lib/majlis-splash";

type Props = {
  className?: string;
  showTagline?: boolean;
  wordmarkProps?: SVGProps<SVGSVGElement>;
};

/**
 * وردمارك دخولية «المجلس العلمي» — SVG ثابت بلا خط وقت التشغيل.
 * النسخة الحرجة للإقلاع في index.html؛ هذا المكوّن للاختبارات والاستخدام البرمجي.
 */
export function MajlisSplashWordmark({ className, wordmarkProps }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={MAJLIS_WORDMARK_VIEWBOX}
      fill="currentColor"
      role="img"
      aria-label="المجلس العلمي"
      focusable="false"
      className={className}
      {...wordmarkProps}
    >
      <title>المجلس العلمي</title>
      <g transform="scale(1,-1)">
        <path d={MAJLIS_WORDMARK_PATH} />
      </g>
    </svg>
  );
}

export function MajlisSplashTagline({ className }: { className?: string }) {
  return <p className={className}>{SPLASH_TAGLINE}</p>;
}
