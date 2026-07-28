/**
 * Inline rich-text-ish word diff: original vs edited.
 */
import { useMemo } from "react";

export type DiffViewerProps = {
  original: string;
  edited: string;
  className?: string;
};

type DiffToken = { text: string; kind: "same" | "add" | "del" };

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

/** Simple LCS word diff — enough for moderation inline review. */
function wordDiff(original: string, edited: string): DiffToken[] {
  const a = tokenize(original);
  const b = tokenize(edited);
  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return b.map((t) => ({ text: t, kind: "add" as const }));
  if (b.length === 0) return a.map((t) => ({ text: t, kind: "del" as const }));

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = m;
  let j = n;
  const stack: DiffToken[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ text: a[i - 1], kind: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ text: b[j - 1], kind: "add" });
      j--;
    } else if (i > 0) {
      stack.push({ text: a[i - 1], kind: "del" });
      i--;
    }
  }
  while (stack.length) tokens.push(stack.pop()!);
  return tokens;
}

export function DiffViewer({ original, edited, className }: DiffViewerProps) {
  const tokens = useMemo(() => wordDiff(original, edited), [original, edited]);

  if (!original.trim() && edited.trim()) {
    return (
      <div className={`rh-diff${className ? ` ${className}` : ""}`} dir="rtl">
        <p className="rh-diff__label">نص جديد</p>
        <p className="rh-diff__body">
          <span className="rh-diff__add">{edited}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`rh-diff${className ? ` ${className}` : ""}`} dir="rtl">
      <div className="rh-diff__cols">
        <div>
          <p className="rh-diff__label">الأصل</p>
          <p className="rh-diff__body rh-diff__body--muted">
            {original || "—"}
          </p>
        </div>
        <div>
          <p className="rh-diff__label">المعدَّل (فروقات الكلمات)</p>
          <p className="rh-diff__body">
            {tokens.map((t, idx) => (
              <span key={`${t.kind}-${idx}`} className={`rh-diff__${t.kind}`}>
                {t.text}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
