import { Link } from "wouter";

type Props = {
  active?: "hub" | "surah" | "juz" | "hizb" | "quarters" | "tajweed" | "stories";
};

export function QuranSubnav({ active = "hub" }: Props) {
  return (
    <nav className="quran-subnav" aria-label="أقسام القرآن">
      <Link href="/quran" className={`quran-subnav__link${active === "hub" ? " is-active" : ""}`}>المصحف</Link>
      <Link href="/quran/juz" className={`quran-subnav__link${active === "juz" ? " is-active" : ""}`}>الأجزاء</Link>
      <Link href="/quran/hizb" className={`quran-subnav__link${active === "hizb" ? " is-active" : ""}`}>الأحزاب</Link>
      <Link href="/quran/quarters" className={`quran-subnav__link${active === "quarters" ? " is-active" : ""}`}>أرباع الحزب</Link>
      <Link href="/quran/tajweed" className={`quran-subnav__link${active === "tajweed" ? " is-active" : ""}`}>التجويد</Link>
      <Link href="/quran/surah-stories" className={`quran-subnav__link${active === "stories" ? " is-active" : ""}`}>قصص السور</Link>
      <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
      <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      <Link href="/daily-wird" className="quran-subnav__link">الورد اليومي</Link>
    </nav>
  );
}
