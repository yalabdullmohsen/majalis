import { Link, useLocation } from "wouter";

type Props = {
  active?: "mushaf" | "recitation" | "tajweed" | "stories" | "live" | "radio" | "wird";
};

export function QuranSubnav({ active }: Props) {
  const [location] = useLocation();

  const isActive = (key: Props["active"], href: string) => {
    if (active) return active === key;
    const path = href.split("?")[0];
    return location === path || location.startsWith(`${path}/`);
  };

  const link = (key: Props["active"], href: string, label: string) => (
    <Link
      href={href}
      className={`quran-v2-subnav__link${isActive(key, href) ? " is-active" : ""}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="quran-v2-subnav" aria-label="أقسام القرآن">
      {link("mushaf", "/quran/mushaf", "المصحف الشريف")}
      {link("recitation", "/quran", "التلاوات الصوتية")}
      {link("tajweed", "/quran/tajweed", "التجويد")}
      {link("stories", "/quran/surah-stories", "قصص القرآن")}
      {link("live", "/quran-live", "البث المباشر")}
      {link("radio", "/quran-radio", "الإذاعات")}
      {link("wird", "/daily-wird", "الورد اليومي")}
    </nav>
  );
}

export default QuranSubnav;
