/**
 * كشف هوية المجلس عند أول فتح للجلسة — طبقة React فوق التطبيق بعد الإقلاع الأصلي.
 * ليست شاشة boot في index.html (محظورة)، وليست بوابة ترحيب منفصلة.
 */
import { useEffect, useState, type ReactNode } from "react";
import "@/styles/components/brand-reveal.css";

const SESSION_KEY = "mj-brand-reveal-seen-v1";
const HOLD_MS = 2200;
const EXIT_MS = 780;
const REDUCED_HOLD_MS = 280;

type Phase = "live" | "leaving" | "gone";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* تجاهل */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function BrandReveal({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => (alreadySeen() ? "gone" : "live"));

  useEffect(() => {
    if (phase !== "live") return;
    const hold = prefersReducedMotion() ? REDUCED_HOLD_MS : HOLD_MS;
    const t = window.setTimeout(() => setPhase("leaving"), hold);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const exit = prefersReducedMotion() ? 120 : EXIT_MS;
    const t = window.setTimeout(() => {
      markSeen();
      setPhase("gone");
    }, exit);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "gone") return;
    const skip = () => setPhase((p) => (p === "gone" ? p : "leaving"));
    window.addEventListener("pointerdown", skip, { once: true, passive: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "gone") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  return (
    <>
      {children}
      {phase !== "gone" ? (
        <div
          className={`mj-brand-reveal${phase === "leaving" ? " mj-brand-reveal--leaving" : ""}`}
          role="presentation"
          aria-hidden="true"
        >
          <div className="mj-brand-reveal__field" />
          <div className="mj-brand-reveal__bloom" />
          <div className="mj-brand-reveal__lattice" aria-hidden="true" />
          <div className="mj-brand-reveal__sweep" aria-hidden="true" />
          <div className="mj-brand-reveal__stage">
            <img
              className="mj-brand-reveal__mark"
              src="/brand/splash-logo.png"
              alt=""
              width={512}
              height={728}
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default BrandReveal;
