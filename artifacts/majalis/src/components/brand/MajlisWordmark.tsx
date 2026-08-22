import type { SVGProps } from "react";
import { MAJLIS_WORDMARK_PATH, MAJLIS_WORDMARK_VIEWBOX } from "@/lib/majlis-wordmark-path";

/**
 * وردمارك «المجلس العلمي» — مسارات SVG ثابتة من خط Aref Ruqaa Bold المحلي (SIL OFL).
 * أسلوب رقعة فاخر قريب من الثلث الجلي؛ بلا تحميل خط وقت التشغيل، بلا FOUT.
 */

export default function MajlisWordmark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={MAJLIS_WORDMARK_VIEWBOX}
      fill="currentColor"
      role="img"
      aria-label="المجلس العلمي"
      focusable="false"
      className={className}
      {...props}
    >
      <title>المجلس العلمي</title>
      <g transform="scale(1,-1)">
        <path d={MAJLIS_WORDMARK_PATH} />
      </g>
    </svg>
  );
}
