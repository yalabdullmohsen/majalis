import { Link } from "wouter";
import { IslamicDivider } from "@/components/islamic/IslamicOrnament";
import { FOOTER_IA_GROUPS } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3" dir="rtl">
      <div className="site-footer-ornament">
        <IslamicDivider />
      </div>
      <div className="site-footer-inner site-footer-inner--v3">
        <div className="site-footer-brand">
          <img src="/logo.png" alt="" width={40} height={40} className="site-footer-logo" aria-hidden="true" />
          <div>
            <strong>المجلس العلمي</strong>
            <p>منصة علمية شرعية — دروس وقرآن وأبحاث وعبادة في مكان واحد.</p>
          </div>
        </div>

        <div className="site-footer-groups">
          {FOOTER_IA_GROUPS.map((group) => (
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

        <p className="site-footer-copy">© {new Date().getFullYear()} المجلس العلمي — جميع الحقوق محفوظة</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
