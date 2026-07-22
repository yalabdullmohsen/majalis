import { Link } from "wouter";
import { CONTACT_EMAIL } from "@/lib/site-config";

function IslamicStarFooter() {
  const cx = 16, r1 = 13, r2 = 7;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cx + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="footer-star">
      <polygon points={pts} fill="none" stroke="var(--majalis-emerald,#173D35)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      <circle cx={cx} cy={cx} r="2.5" fill="var(--majalis-emerald,#173D35)" opacity="0.7" />
    </svg>
  );
}

const FOOTER_GROUPS = [
  {
    title: "استكشف",
    links: [
      { href: "/quran-hub", label: "القرآن الكريم" },
      { href: "/learn", label: "أبواب العلم" },
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
        <div className="site-footer-brand">
          <IslamicStarFooter />
          <div>
            <img
              src="/logo-calligraphy.png"
              alt="المجلس العلمي"
              className="site-footer-logo site-footer-logo--calligraphy"
              loading="lazy"
              decoding="async"
              width="2044"
              height="788"
            />
            <p>نبني منظومة الإسلام الرقمي؛ علمٌ موثوق وتقنية تقرّب القرآن والمعرفة والعبادة للجميع.</p>
            <p className="site-footer-email">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
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

        <p className="site-footer-copy">© {new Date().getFullYear()} المجلس العلمي</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
