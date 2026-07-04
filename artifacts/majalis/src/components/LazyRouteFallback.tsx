import { useEffect, useState } from "react";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

function IslamicStar({ size = 44 }: { size?: number }) {
  const cx = size / 2;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? size * 0.43 : size * 0.22;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cx + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true"
      style={{ animation: "lrf-rotate 2s linear infinite", display: "block", flexShrink: 0 }}>
      <style>{`
        @keyframes lrf-rotate{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){svg{animation:none!important;opacity:.4}}
      `}</style>
      <polygon points={pts} fill="none" stroke="var(--v2-green,#1F6F52)"
        strokeWidth="1.6" strokeLinejoin="round" opacity="0.85" />
      <circle cx={cx} cy={cx} r={size * 0.09} fill="var(--v2-green,#1F6F52)" opacity="0.6" />
    </svg>
  );
}

export function LazyRouteFallback() {
  const [retries, setRetries] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setRetries((n) => n + 1), PAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [retries]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "1rem", minHeight: "50vh",
      padding: "2rem",
    }} role="status" aria-label="جارٍ تحميل الصفحة…">
      <IslamicStar size={48} />
      <p style={{ fontSize: "0.85rem", color: "var(--v2-ink-3,#8A847E)", margin: 0 }}>
        جارٍ تحميل الصفحة…
      </p>
    </div>
  );
}
