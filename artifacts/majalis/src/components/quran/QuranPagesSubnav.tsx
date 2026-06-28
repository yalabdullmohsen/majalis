import { Link } from "wouter";

export type QuranSubnavKey = "mushaf" | "tajweed" | "stories" | "live" | "radio";

const LINKS: { key: QuranSubnavKey; href: string; label: string }[] = [
  { key: "mushaf", href: "/quran", label: "المصحف" },
  { key: "tajweed", href: "/quran/tajweed", label: "التجويد" },
  { key: "stories", href: "/quran/surah-stories", label: "قصص السور" },
  { key: "live", href: "/quran-live", label: "البث المباشر" },
  { key: "radio", href: "/quran-radio", label: "الإذاعات" },
];

export function QuranPagesSubnav({ active }: { active: QuranSubnavKey }) {
  return (
    <nav className="quran-pages-subnav" aria-label="أقسام القرآن">
      {LINKS.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={`quran-pages-subnav__link${active === link.key ? " is-active" : ""}`}
          aria-current={active === link.key ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
