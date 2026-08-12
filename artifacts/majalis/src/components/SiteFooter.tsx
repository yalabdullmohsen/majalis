import { useEffect, useId, useState } from "react";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site-config";
import {
  SITE_FOOTER_GROUPS,
  SITE_FOOTER_TAGLINE,
  type FooterGroup,
} from "@/lib/site-footer-nav";

function FooterGroupBlock({
  group,
  open,
  onToggle,
  mobile,
}: {
  group: FooterGroup;
  open: boolean;
  onToggle: () => void;
  mobile: boolean;
}) {
  const panelId = `footer-group-${group.id}`;
  const titleId = `${panelId}-title`;

  if (!mobile) {
    return (
      <div className="site-footer-group">
        <h2 className="site-footer-group__title" id={titleId}>
          {group.title}
        </h2>
        <nav aria-labelledby={titleId}>
          {group.links.map((l) => (
            <Link key={l.href + l.label} href={l.href} className="site-footer-link">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="site-footer-group site-footer-group--accordion">
      <button
        type="button"
        className="site-footer-accordion__btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{group.title}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className={open ? "site-footer-accordion__chevron is-open" : "site-footer-accordion__chevron"}
        />
      </button>
      <nav
        id={panelId}
        className="site-footer-accordion__panel"
        hidden={!open}
        aria-label={group.title}
      >
        {group.links.map((l) => (
          <Link key={l.href + l.label} href={l.href} className="site-footer-link">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const labelId = useId();
  const [isMobile, setIsMobile] = useState(false);
  const [openId, setOpenId] = useState<string | null>(SITE_FOOTER_GROUPS[0]?.id ?? null);

  useEffect(() => {
    void import("@/styles/components/site-footer-menu.css");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <footer
      className="site-footer site-footer--global"
      dir="rtl"
      aria-labelledby={labelId}
    >
      <div className="site-footer-inner site-footer-inner--global">
        <p id={labelId} className="sr-only">
          تذييل موقع المجلس العلمي
        </p>

        <div className="site-footer-groups">
          {SITE_FOOTER_GROUPS.map((group) => (
            <FooterGroupBlock
              key={group.id}
              group={group}
              mobile={isMobile}
              open={openId === group.id}
              onToggle={() => setOpenId((cur) => (cur === group.id ? null : group.id))}
            />
          ))}
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {year} المجلس العلمي — {SITE_FOOTER_TAGLINE}
          </p>
          <p className="site-footer-email">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
