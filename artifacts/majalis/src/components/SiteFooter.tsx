import { Link } from "wouter";

const FOOTER_GROUPS = [
  {
    title: "المحتوى",
    links: [
      { href: "/lessons", label: "الدروس" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/research", label: "الأبحاث العلمية" },
      { href: "/quran-scientific-circles", label: "الحلقات القرآنية" },
      { href: "/question-answer", label: "سؤال وجواب" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/qa", label: "الأسئلة" },
    ],
  },
  {
    title: "العبادة",
    links: [
      { href: "/quran", label: "القرآن" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/prayer-ranks", label: "مراتب الصلاة" },
      { href: "/calendar", label: "التقويم العلمي" },
      { href: "/tasbih", label: "التسابيح" },
    ],
  },
  {
    title: "المنصة",
    links: [
      { href: "/about", label: "من نحن" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/topics", label: "الموضوعات العلمية" },
      { href: "/scholar-search", label: "الباحث العلمي" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v2026" dir="rtl">
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
