import { Link, useLocation } from "wouter";

const LINKS = [
  { href: "/quran", label: "القراءة النصية", id: "text" as const },
  { href: "/quran/mushaf", label: "المصحف الشريف (طبعة الكويت)", id: "mushaf" as const },
  { href: "/quran/search", label: "البحث في القرآن", id: "search" as const },
  { href: "/quran/tafsir", label: "التفسير", id: "tafsir" as const },
  { href: "/quran-radio", label: "الاستماع", id: "listen" as const },
];

type ActiveId = (typeof LINKS)[number]["id"];

function resolveActive(path: string, override?: ActiveId): ActiveId | null {
  if (override) return override;
  if (path.startsWith("/quran/mushaf")) return "mushaf";
  if (path.startsWith("/quran/search")) return "search";
  if (path.startsWith("/quran/tafsir")) return "tafsir";
  if (path === "/quran-radio" || path === "/quran-live") return "listen";
  if (path === "/quran" || path.startsWith("/quran?")) return "text";
  return null;
}

type Props = {
  active?: ActiveId;
};

export function QuranSubnav({ active: activeOverride }: Props = {}) {
  const [path] = useLocation();
  const active = resolveActive(path, activeOverride);

  return (
    <nav className="quran-v2-subnav" aria-label="أقسام القرآن">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`quran-v2-subnav__link${active === link.id ? " is-active" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
