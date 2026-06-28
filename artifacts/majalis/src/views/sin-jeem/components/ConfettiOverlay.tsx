import { useEffect, useState } from "react";

export function ConfettiOverlay({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const colors = ["#1F6E54", "#B08D2E", "#dc2626", "#0891b2", "#7c3aed"];
    setPieces(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[i % colors.length],
        delay: Math.random() * 0.8,
      })),
    );
  }, [active]);

  if (!active || !pieces.length) return null;

  return (
    <div className="sj-confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="sj-confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
