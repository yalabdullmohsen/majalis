import { Link } from "wouter";
import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-config";

const FOOTER_GROUPS = [
  {
    title: "استكشف",
    links: [
      { href: "/quran-hub", label: "القرآن الكريم" },
      { href: "/lessons", label: "الدروس والدورات" },
      { href: "/library", label: "المكتبة العلمية" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/sitemap", label: "خريطة الموقع" },
    ],
  },
  {
    title: "عن المنصة",
    links: [
      { href: "/about", label: "عن التطبيق" },
      { href: "/methodology", label: "منهجية التوثيق" },
      { href: "/privacy", label: "سياسة الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
];

export function SiteFooter() {
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <footer className="site-footer site-footer--v3" dir="rtl" aria-label={`تذييل موقع ${SITE_NAME}`}>
      <div className="site-footer-inner site-footer-inner--v3">
        <div className="site-footer-brand">
          <strong className="site-footer-brand-name">{SITE_NAME}</strong>
          <p>{SITE_DESCRIPTION}</p>
          <p className="site-footer-email">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>

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

        <p className="site-footer-copy">
          © {new Date().getFullYear()} {SITE_NAME}
          <span className="site-footer-copy__sep" aria-hidden="true">
            {" "}
            ·{" "}
          </span>
          <a href={SITE_URL} className="site-footer-copy__host">
            {host}
          </a>
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;
