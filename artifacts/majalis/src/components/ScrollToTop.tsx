import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * زر صعود واضح المعنى — سهم للأعلى فقط.
 * يظهر بعد التمرير، فوق الشريط السفلي، بلا تغطية للمحتوى الأساسي.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-to-top"
      data-scroll-to-top="1"
      aria-label="إلى الأعلى"
      title="إلى الأعلى"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={22} strokeWidth={2.6} aria-hidden="true" className="stt-icon" />
      <span className="stt-label">أعلى</span>
    </button>
  );
}
