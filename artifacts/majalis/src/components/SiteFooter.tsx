import { Link } from "wouter";

const FOOTER_GROUPS = [
  {
    title: "المحتوى",
    links: [
      { href: "/lessons", label: "الدروس" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/hadith", label: "الأحاديث" },
      { href: "/stories", label: "القصص" },
      { href: "/qa", label: "الأسئلة" },
    ],
  },
  {
    title: "العبادة",
    links: [
      { href: "/quran", label: "القرآن" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/tasbih", label: "التسابيح" },
    ],
  },
  {
    title: "التطبيق",
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
            <p>تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.</p>
            <p className="site-footer-email">
              <a href="mailto:yalabdullmohsen1@gmail.com">yalabdullmohsen1@gmail.com</a>
            </p>
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
