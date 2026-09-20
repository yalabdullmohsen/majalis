import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

function isModalOverlayOpen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      [
        '[role="dialog"][data-state="open"]',
        '[data-state="open"][data-radix-dialog-content]',
        '[data-state="open"][data-radix-alert-dialog-content]',
        '[aria-modal="true"]',
      ].join(","),
    ),
  );
}

/**
 * زر صعود صغير واضح المعنى.
 * يظهر بعد تمرير فعلي فقط، يختفي مع Sheet/Dialog، فوق الشريط السفلي بلا تغطية للمحتوى.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY > 280;
      setVisible(scrolled && !isModalOverlayOpen());
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    const mo = new MutationObserver(update);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-modal", "open"],
    });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mo.disconnect();
    };
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
      <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" className="stt-icon" />
      <span className="stt-label">أعلى</span>
    </button>
  );
}
