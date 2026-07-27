import { Link } from "wouter";
import { CONTACT_EMAIL } from "@/lib/site-config";

const FOOTER_GROUPS = [
  {
    title: "استكشف",
    links: [
      { href: "/quran-hub", label: "القرآن الكريم" },
      { href: "/lessons", label: "الدروس والدورات" },
      { href: "/library", label: "المكتبة العلمية" },
      { href: "/sitemap", label: "جميع الأقسام" },
    ],
  },
  {
    title: "المجلس العلمي",
    links: [
      { href: "/about", label: "عن المجلس" },
      { href: "/methodology", label: "منهجية التوثيق" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
      { href: "/contact", label: "التواصل" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3" dir="rtl" aria-label="تذييل موقع المجلس العلمي">
      <div className="site-footer-inner site-footer-inner--v3">
        <p className="site-footer-email">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <div className="site-footer-groups">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="site-footer-group">
              <h3 className="site-footer-group__title">{group.title}</h3>
              <nav aria-label={group.title}>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
