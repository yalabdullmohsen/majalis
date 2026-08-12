import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export function NavProgressBar() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevLocation = useRef(location);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setVisible(true);
    setWidth(0);

    // Animate to 85% quickly
    rafRef.current = requestAnimationFrame(() => {
      setWidth(85);
    });

    // Complete after 350ms
    timerRef.current = setTimeout(() => {
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [location]);

  if (!visible) return null;

  return (
    <div
      className="nav-progress-track"
      aria-hidden="true"
      role="progressbar"
    >
      <div
        className="nav-progress-bar"
        style={{ "--nav-pct": `${width}%` } as React.CSSProperties}
      />
    </div>
  );
}
