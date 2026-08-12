import { useEffect, useRef, useState } from "react";

const SHOW_AFTER_MS = 200;
const MIN_VISIBLE_MS = 400;

/**
 * يؤخّر إظهار هيكل التحميل 200ms، ويبقيه 400ms على الأقل إن ظهر.
 */
export function useDeferredLoading(loading: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (loading) {
      showTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, SHOW_AFTER_MS);
    } else {
      const shownAt = shownAtRef.current;
      if (shownAt == null) {
        setVisible(false);
      } else {
        const remain = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
        hideTimer = setTimeout(() => {
          shownAtRef.current = null;
          setVisible(false);
        }, remain);
      }
    }

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [loading]);

  return visible;
}
