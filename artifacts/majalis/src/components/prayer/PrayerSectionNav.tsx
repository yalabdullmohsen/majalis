import { Link, useLocation } from "wouter";

const TABS = [
  { href: "/prayer-times", label: "مواقيت الصلاة" },
  { href: "/prayer-tracking", label: "متابعة الصلوات" },
  { href: "/prayer-ranks", label: "مراتب الصلاة" },
  { href: "/prayer-virtues", label: "فضائل الصلاة" },
  { href: "/prayer-rulings", label: "أحكام الصلاة" },
] as const;

export function PrayerSectionNav() {
  const [location] = useLocation();

  return (
    <nav className="prayer-section-nav" aria-label="أقسام الصلاة">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={location === href || location.startsWith(`${href}/`) ? "is-active" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
