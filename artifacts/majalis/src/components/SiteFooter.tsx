import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { ChevronUp, Handshake, Mail, Scale, Shield, X } from "lucide-react";
import { CONTACT_EMAIL, mailtoWithSubject } from "@/lib/site-config";

type FooterMenuItem = {
  href: string;
  label: string;
  Icon: typeof Mail;
  external?: boolean;
};

/** تذييل قانوني/تواصل فقط — بلا «من نحن/مكتبة/مستجدات» بعد تنظيف الاكتشاف. */
const FOOTER_MENU_ITEMS: FooterMenuItem[] = [
  { href: "/methodology", label: "منهجية التوثيق", Icon: Scale },
  { href: "/privacy", label: "الخصوصية", Icon: Shield },
  { href: "/terms", label: "الشروط", Icon: Scale },
  { href: "/contact", label: "التواصل", Icon: Mail },
  {
    href: mailtoWithSubject("عرض رعاية — المجلس العلمي"),
    label: "نقبل بعروض الرعاية",
    Icon: Handshake,
    external: true,
  },
];

function FooterAboutSheet({
  open,
  onClose,
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape وزر إغلاق ظاهر.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="footer-about-overlay" role="presentation" onClick={onClose}>
      <div
        className="footer-about-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="footer-about-sheet__handle" aria-hidden="true" />
        <div className="footer-about-sheet__head">
          <h2 id={titleId}>عن المجلس والتواصل</h2>
          <button
            type="button"
            className="footer-about-sheet__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <nav className="footer-about-sheet__nav" aria-label="روابط المجلس">
          {FOOTER_MENU_ITEMS.map(({ href, label, Icon, external }) =>
            external ? (
              <a
                key={href}
                href={href}
                className="footer-about-sheet__item footer-about-sheet__item--sponsor"
                onClick={onClose}
              >
                <span className="footer-about-sheet__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span>{label}</span>
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="footer-about-sheet__item"
                onClick={onClose}
              >
                <span className="footer-about-sheet__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span>{label}</span>
              </Link>
            ),
          )}
        </nav>
        <p className="footer-about-sheet__email">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </div>,
    document.body,
  );
}

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    void import("@/styles/components/site-footer-menu.css");
  }, []);

  return (
    <footer className="site-footer site-footer--minimal" dir="rtl" aria-label="تذييل موقع المجلس العلمي">
      <div className="site-footer-inner site-footer-inner--minimal">
        <button
          type="button"
          className="site-footer-menu-btn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span>عن المجلس والتواصل</span>
          <ChevronUp size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <FooterAboutSheet open={open} onClose={() => setOpen(false)} titleId={titleId} />
    </footer>
  );
}

export default SiteFooter;
