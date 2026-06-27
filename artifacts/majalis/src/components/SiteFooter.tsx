import { Link } from "wouter";

import { T } from "@/lib/terminology";

const FOOTER_GROUPS = [
  {
    title: "المحتوى",
    links: [
      { href: "/lessons", label: T.lessons },
      { href: "/fawaid", label: T.fawaid },
      { href: "/qa", label: T.qa },
    ],
  },
  {
    title: "العبادة",
    links: [
      { href: "/quran", label: "القرآن" },
      { href: "/adhkar", label: T.adhkar },
      { href: "/prayer-times", label: T.prayerTimes },
      { href: "/tasbih", label: T.tasbih },
    ],
  },
  {
    title: "المنصة",
    links: [
      { href: "/about", label: "من نحن" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3" dir="rtl">
      <div className="site-footer-inner site-footer-inner--v3">
        <div className="site-footer-brand">
          <img src="/logo.png" alt="" width={40} height={40} className="site-footer-logo" aria-hidden="true" />
          <div>
            <strong>المجلس العلمي</strong>
            <p>منصة علمية شرعية للدروس والعبادة والمحتوى اليومي.</p>
          </div>
        </div>

        <div className="site-footer-groups">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="site-footer-group">
              <p>{group.title}</p>
              <nav>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <p className="site-footer-copy">© {new Date().getFullYear()} المجلس العلمي</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
