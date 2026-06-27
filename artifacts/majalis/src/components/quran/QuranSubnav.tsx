import { Link } from "wouter";

export function QuranSubnav() {
  return (
    <nav className="quran-v2-subnav" aria-label="أقسام القرآن">
      <Link href="/quran" className="quran-v2-subnav__link is-active">المصحف</Link>
      <Link href="/quran/tajweed" className="quran-v2-subnav__link">التجويد</Link>
      <Link href="/quran/surah-stories" className="quran-v2-subnav__link">قصص القرآن</Link>
      <Link href="/quran-live" className="quran-v2-subnav__link">البث المباشر</Link>
      <Link href="/quran-radio" className="quran-v2-subnav__link">الإذاعات</Link>
      <Link href="/daily-wird" className="quran-v2-subnav__link">الورد اليومي</Link>
    </nav>
  );
}
