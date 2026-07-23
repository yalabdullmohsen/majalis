import { useRef } from "react";
import { Link, useLocation } from "wouter";
import { Baby, BookOpen, GraduationCap, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  prefetch: () => void;
};

/* أربعة أقسام رئيسية فقط — شريط ثابت أعلى الصفحة، منفصل عن التنقل السفلي
   (5 عناصر) وإن تشاركا بعض الوجهات (الرئيسية/تعلّم/القرآن): الحالة النشطة
   في كليهما تُحسب من نفس location الحالي فتبقى متّسقة تلقائيًا بلا حالة
   مشتركة إضافية. "الأطفال" وجهة جديدة لا مقابل لها في الشريط السفلي. */
export const SECTION_TABS: SectionTab[] = [
  { href: "/",         label: "الرئيسية", Icon: Home,          prefetch: () => import("@/views/HomePage") },
  { href: "/learn",    label: "تعلّم",    Icon: GraduationCap, prefetch: () => import("@/views/learn/LearnHubPage") },
  { href: "/quran-hub", label: "القرآن",  Icon: BookOpen,      prefetch: () => import("@/views/QuranHubPage") },
  { href: "/kids",     label: "الأطفال",  Icon: Baby,          prefetch: () => import("@/views/KidsPage") },
];

export function isTabActive(location: string, href: string): boolean {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(href + "/");
}

export function TopSectionBar() {
  const [location] = useLocation();
  const prefetched = useRef(new Set<string>());

  // قارئ المصحف الغامر له تنقّله الخاص — نفس استثناء BottomNavBar.
  if (location.startsWith("/mushaf")) return null;

  function triggerPrefetch(tab: SectionTab) {
    if (prefetched.current.has(tab.href)) return;
    prefetched.current.add(tab.href);
    void tab.prefetch();
  }

  return (
    <nav className="top-section-bar" aria-label="أقسام رئيسية">
      <div className="top-section-bar__scroll">
        {SECTION_TABS.map((tab) => {
          const active = isTabActive(location, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`top-section-bar__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onTouchStart={() => triggerPrefetch(tab)}
              onMouseEnter={() => triggerPrefetch(tab)}
            >
              <tab.Icon size={17} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
