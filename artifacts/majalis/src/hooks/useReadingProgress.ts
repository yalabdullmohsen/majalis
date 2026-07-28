import { useEffect, useState } from "react";
import { addPassiveScrollListener } from "@/lib/gesture-raf";

export function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(100, Math.round((el.scrollTop / total) * 100)));
    };
    const unsub = addPassiveScrollListener(window, update);
    update();
    return unsub;
  }, []);

  return progress;
}
