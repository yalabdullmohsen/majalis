import { Link } from "wouter";

const FOOTER_LINKS = [
  { href: "/lessons", label: "الدروس" },
  { href: "/kuwait-lessons", label: "دروس الكويت" },
  { href: "/calendar", label: "التقويم" },
  { href: "/adhkar", label: "الأذكار" },
  { href: "/fawaid", label: "الفوائد" },
  { href: "/qa", label: "الأسئلة" },
  { href: "/sheikhs", label: "المشايخ" },
  { href: "/about", label: "عن المنصة" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img src="/logo.png" alt="" className="site-footer-logo" aria-hidden="true" />
          <div>
            <strong>المجلس العلمي</strong>
            <p>منصة علمية شرعية تجمع الدروس والفوائد والأذكار في مكان واحد.</p>
          </div>
        </div>
        <nav className="site-footer-nav" aria-label="روابط سريعة">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
        <p className="site-footer-copy">
          © {new Date().getFullYear()} المجلس العلمي — المحتوى علمي وتعليمي.
        </p>
      </div>
    </footer>
  );
}
