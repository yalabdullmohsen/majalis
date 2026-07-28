import { useEffect, useState } from "react";
import { bindRafListener } from "@/lib/passive-events";

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
    const unbind = bindRafListener(window, "scroll", update);
    update();
    return unbind;
  }, []);

  return progress;
}
