import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  BarChart3, BookMarked, BookOpen, Brain, CalendarDays, ChevronDown, ChevronUp,
  Clock, CreditCard, LogIn, MapPin, Scale, ScrollText, Search, Settings, Star, UserPlus, X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePageSwipe } from "@/hooks/usePageSwipe";
import { isNavHrefActive } from "@/lib/nav-active";
import { filterNavItems, isComingSoonPath } from "@/lib/nav-visibility";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
};

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  desc?: string;
};

type NavGroup = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
};

const IcoHome = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 8L9 2l7.5 6v8.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V8z"/>
    <path d="M6.5 17V11h5v6"/>
  </svg>
);
const IcoUser = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="6" r="4"/>
    <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
  </svg>
);

/** قائمة جانبية مختصرة بعد تنظيف الأقسام — بلا «من نحن» ولا الأقسام المحذوفة. */
const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "main",
    title: "التنقل",
    icon: <IcoHome />,
    items: [
      { href: "/", label: seoNavLabel("/", "الرئيسية"), Icon: BarChart3 },
      { href: "/mushaf", label: seoNavLabel("/mushaf", "القرآن"), Icon: BookOpen, desc: "المصحف الشريف" },
      { href: "/quran-knowledge", label: seoNavLabel("/quran-knowledge", "القرآن وعلومه"), Icon: BookMarked, desc: "فهرس · علوم · أسباب · قصص" },
      { href: "/hadith", label: seoNavLabel("/hadith", "الحديث والسنة"), Icon: ScrollText },
      { href: "/fiqh", label: seoNavLabel("/fiqh", "الفقه والأحكام"), Icon: Scale },
      { href: "/memorization", label: seoNavLabel("/memorization", "الحفظ والمراجعة"), Icon: Brain },
      { href: "/occasions-lessons", label: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), Icon: CalendarDays },
      { href: "/islamic-directory", label: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), Icon: MapPin },
      { href: "/prayer-times", label: seoNavLabel("/prayer-times", "الصلاة"), Icon: Clock },
      { href: "/search", label: seoNavLabel("/search", "البحث الشامل"), Icon: Search },
      { href: "/settings", label: seoNavLabel("/settings", "الإعدادات"), Icon: Settings },
    ],
  },
];

const VISIBLE_DRAWER_GROUPS: NavGroup[] = DRAWER_GROUPS.map((g) => ({
  ...g,
  items: filterNavItems(g.items),
}));

const HREF_TO_GROUP: Record<string, string> = {};
VISIBLE_DRAWER_GROUPS.forEach((g) => {
  g.items.forEach((item) => { HREF_TO_GROUP[item.href] = g.id; });
});

function getActiveGroup(pathname: string): string {
  if (pathname === "/") return "main";
  for (const [href, gid] of Object.entries(HREF_TO_GROUP)) {
    if (href !== "/" && (pathname === href || pathname.startsWith(href + "/"))) return gid;
  }
  return "main";
}

export function SideNavDrawer({ open, onClose, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

  const activeGroup = useMemo(() => getActiveGroup(pathname), [pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(["main", "account", activeGroup]);
  });

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  const { swipeHandlers } = usePageSwipe({
    onPrev: onClose,
    onNext: () => {},
    threshold: 70,
    disabled: !open,
  });

  if (!open || typeof document === "undefined") return null;

  const isActive = (href: string) => isNavHrefActive(pathname, href);

  const onSoonClick = (label: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-coming-soon-open", { detail: { title: label } }));
  };

  const drawer = (
    <div className="mobile-nav-layer mobile-nav-layer--drawer" role="presentation">
      <button
        type="button"
        className="mobile-nav-backdrop"
        aria-label="إغلاق القائمة الجانبية"
        onClick={onClose}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        id="main-navigation-drawer"
        className="side-nav-drawer--v2"
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الجانبية"
        onClick={(e) => e.stopPropagation()}
        {...swipeHandlers}
      >
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <div className="side-nav-drawer__brand">
            <img
              src="/logo-calligraphy.png"
              alt="المجلس العلمي"
              className="side-nav-drawer__brand-logo"
              loading="lazy"
              decoding="async"
            />
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="side-nav-close">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="side-nav-drawer__body">
          {VISIBLE_DRAWER_GROUPS.map((group) => {
            const isOpen = openGroups.has(group.id);
            const hasActive = group.items.some((i) => isActive(i.href));

            return (
              <div key={group.id} className={`side-nav-group side-nav-group--v2${hasActive ? " side-nav-group--has-active" : ""}`}>
                <button
                  type="button"
                  className="side-nav-group__toggle"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-${group.id}`}
                >
                  <span className="side-nav-group__toggle-label">
                    <span className="side-nav-group__emoji" aria-hidden="true">{group.icon}</span>
                    <span className="side-nav-group__title">{group.title}</span>
                  </span>
                  {isOpen
                    ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                    : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
                </button>

                {isOpen && (
                  <div id={`nav-group-${group.id}`}>
                    <nav aria-label={group.title} className="side-nav-group__items">
                      {group.items.map(({ href, label, Icon, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={isComingSoonPath(href) ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
                          className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
                          aria-label={isComingSoonPath(href) ? `${label} — قريبًا` : label}
                        >
                          <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                          <span className="side-nav-link__content">
                            <span className="side-nav-link__label">
                              {label}
                              {isComingSoonPath(href) ? <span className="nav-soon-badge">قريبًا</span> : null}
                            </span>
                            {desc && <span className="side-nav-link__desc">{desc}</span>}
                          </span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            );
          })}

          <div className="side-nav-group side-nav-group--v2">
            <button
              type="button"
              className="side-nav-group__toggle"
              onClick={() => toggleGroup("account")}
              aria-expanded={openGroups.has("account")}
            >
              <span className="side-nav-group__toggle-label">
                <span className="side-nav-group__emoji" aria-hidden="true"><IcoUser /></span>
                <span className="side-nav-group__title">حسابي</span>
              </span>
              {openGroups.has("account")
                ? <ChevronUp size={15} strokeWidth={2} aria-hidden="true" />
                : <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
            {openGroups.has("account") && (
              <nav aria-label="حسابي" className="side-nav-group__items">
                {isLoggedIn ? (
                  <>
                    {user?.profile?.full_name || user?.email ? (
                      <div className="side-nav-user-info">
                        <span className="side-nav-user-name">{user.profile?.full_name || user.email}</span>
                      </div>
                    ) : null}
                    <Link href="/my-learning" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/my-learning") ? " is-active" : ""}`}>
                      <BarChart3 size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">لوحتي التعليمية</span></span>
                    </Link>
                    <Link href="/my-learning#flashcards" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <CreditCard size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content">
                        <span className="side-nav-link__label">البطاقات المراجعة</span>
                        <span className="side-nav-link__desc">داخل حسابي</span>
                      </span>
                    </Link>
                    <Link href="/stats" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/stats") ? " is-active" : ""}`}>
                      <Star size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">إنجازاتي</span></span>
                    </Link>
                    <Link href="/settings" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/settings") ? " is-active" : ""}`}>
                      <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">الإعدادات</span></span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={onClose} className={`side-nav-link side-nav-link--v2${isActive("/admin") ? " is-active" : ""}`}>
                        <Settings size={16} strokeWidth={1.8} aria-hidden="true" />
                        <span className="side-nav-link__content"><span className="side-nav-link__label">لوحة التحكم</span></span>
                      </Link>
                    )}
                    <button type="button" className="side-nav-link side-nav-link--v2 side-nav-link--danger" onClick={() => { onClose(); onLogout?.(); }}>
                      <LogIn size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">تسجيل الخروج</span></span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <LogIn size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">تسجيل الدخول</span></span>
                    </Link>
                    <Link href="/register" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content"><span className="side-nav-link__label">إنشاء حساب</span></span>
                    </Link>
                    <Link href="/my-learning#flashcards" onClick={onClose} className="side-nav-link side-nav-link--v2">
                      <CreditCard size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span className="side-nav-link__content">
                        <span className="side-nav-link__label">البطاقات المراجعة</span>
                        <span className="side-nav-link__desc">داخل حسابي</span>
                      </span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default SideNavDrawer;
