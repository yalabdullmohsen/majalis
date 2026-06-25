import { Link } from "wouter";

const FOOTER_LINKS = [
  { href: "/about", label: "من نحن" },
  { href: "/calendar", label: "التقويم" },
  { href: "/condolences", label: "قوالب العزاء" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
  { href: "/contact", label: "تواصل معنا" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src="/logo.png" alt="" width={36} height={36} className="site-footer-logo" aria-hidden="true" />
          <div>
            <strong>المجلس العلمي</strong>
            <p>منصة علمية شرعية — دروس الكويت والمحتوى اليومي.</p>
          </div>
        </div>
        <nav className="site-footer-nav" aria-label="روابط الموقع">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="site-footer-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="site-footer-copy">© {new Date().getFullYear()} المجلس العلمي</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
