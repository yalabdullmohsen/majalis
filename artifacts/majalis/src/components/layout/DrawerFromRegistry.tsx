/**
 * صفوف الدرج من مصدر التنقّل الموحّد — أيقونة + عنوان، بلا بطاقات متدرّجة.
 * لا تحميل لخطوط المصحف من هنا — الرابط فقط.
 */
import { memo, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { SIDEBAR_NAV_GROUPS } from "@/lib/sidebar-nav";
import { isNavHrefActive } from "@/lib/nav-active";
import { loadLastPageSync } from "@/lib/quran-last-page";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

type Resume = { page: number; surah?: string };

export const DrawerFromRegistry = memo(function DrawerFromRegistry({
  onNavigate,
  className,
}: Props) {
  const groups = useMemo(() => SIDEBAR_NAV_GROUPS, []);
  const [pathname] = useLocation();
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    const page = loadLastPageSync();
    if (!page) {
      setResume(null);
      return;
    }
    setResume({ page });
    void import("@/lib/quran-api").then(({ SURAH_START_PAGES, getSurahList }) => {
      let surahId = 1;
      for (let i = 0; i < SURAH_START_PAGES.length; i++) {
        const start = SURAH_START_PAGES[i];
        if (typeof start === "number" && start <= page) surahId = i + 1;
        else if (typeof start === "number" && start > page) break;
      }
      const name = getSurahList()[surahId - 1]?.name;
      setResume({ page, surah: name });
    }).catch(() => undefined);
  }, []);

  return (
    <div className={className}>
      {groups.map((group) => (
        <section
          key={group.id}
          className="sidebar-section"
          aria-label={group.title || undefined}
        >
          {group.title ? (
            <h2 className="sidebar-section-title">{group.title}</h2>
          ) : null}
          <nav aria-label={group.title || "تنقّل الدرج"}>
            {group.items.map((item) => {
              const active = isNavHrefActive(pathname, item.href);
              const row = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`sidebar-item${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">
                    <item.Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="sidebar-item-text">
                    <span className="sidebar-item-title">{item.label}</span>
                  </span>
                </Link>
              );
              if (item.href !== "/mushaf" || !resume) return row;
              return (
                <div key={`${item.href}-resume`}>
                  {row}
                  <Link
                    href={`/mushaf?page=${resume.page}`}
                    onClick={onNavigate}
                    className="sidebar-item"
                    aria-label={`متابعة القراءة — صفحة ${resume.page}${resume.surah ? ` — ${resume.surah}` : ""}`}
                  >
                    <span className="sidebar-item-icon" aria-hidden="true">
                      <item.Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span className="sidebar-item-text">
                      <span className="sidebar-item-title">متابعة القراءة</span>
                      <span className="sidebar-item-sub">
                        صفحة {resume.page}
                        {resume.surah ? ` — ${resume.surah}` : ""}
                      </span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </section>
      ))}
    </div>
  );
});
