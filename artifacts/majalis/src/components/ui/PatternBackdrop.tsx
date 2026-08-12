import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * زخرفة هندسية خلف المحتوى — القناة الوحيدة المسموحة للنقش.
 * الشفافية: ≤٦٪ نهارًا، ≤٤٪ ليلًا. اللون من --mj-brand عبر currentColor.
 */
export function PatternBackdrop({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const patternId = `mj-girih-${uid}`;
  return (
    <div className={cn("pattern-backdrop", className)} aria-hidden="true">
      <svg
        className="pattern-backdrop__svg"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="88"
            height="88"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke="currentColor" strokeWidth="0.85">
              <polygon points="44,10 50,30 70,24 58,44 70,64 50,58 44,78 38,58 18,64 30,44 18,24 38,30" />
              <polygon points="44,28 48,38 58,34 54,44 64,48 54,52 58,62 48,58 44,68 40,58 30,62 34,52 24,48 34,44 30,34 40,38" opacity="0.55" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
