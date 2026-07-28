/**
 * غلاف انتقال صفحات المصحف — Instant / Smooth swipe / 3D curl.
 * يعتمد transform3d وwill-change لـ 60fps؛ لا يعيد رسم محتوى الصفحة الثقيل.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export type PageTransitionMode = "instant" | "smooth" | "curl";

type Props = {
  page: number;
  mode: PageTransitionMode;
  children: ReactNode;
  className?: string;
};

export function PageCurlStage({ page, mode, children, className }: Props) {
  const [animClass, setAnimClass] = useState("");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const prevPage = useRef(page);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (page === prevPage.current) return;
    const forward = page > prevPage.current;
    setDir(forward ? "fwd" : "back");
    prevPage.current = page;

    if (mode === "instant") {
      setAnimClass("");
      return;
    }

    const kind = mode === "curl" ? "curl" : "smooth";
    setAnimClass(`pcs--${kind}-${forward ? "fwd" : "back"}`);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAnimClass(""), mode === "curl" ? 420 : 280);
  }, [page, mode]);

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={`pcs-stage ${className ?? ""} ${animClass}`.trim()}
      data-pcs-mode={mode}
      data-pcs-dir={dir}
    >
      <div className="pcs-leaf">{children}</div>
    </div>
  );
}

export default PageCurlStage;
