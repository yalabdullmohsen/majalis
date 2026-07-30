import { createPortal } from "react-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Calendar, CalendarDays, ChevronDown, ChevronUp,
  CreditCard, FileText, GitBranch, GraduationCap,
  HelpCircle, Home, Landmark, Layers, Library,
  LogIn, MapPin, Mic2, Network,
  Rss, Search, Settings, Star,
  Sun, UserPlus, X, Zap,
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

type SubGroup = {
  id: string;
  title: string;
  items: NavItem[];
};

type NavGroup = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items?: NavItem[];
  subGroups?: SubGroup[];
};

/* ── أيقونات SVG للأقسام ── */
const IcoHome = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.5 8L9 2l7.5 6v8.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V8z"/>
    <path d="M6.5 17V11h5v6"/>
  </svg>
);
const IcoQuran = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15V4C8 2.5 6 2 3 2.5v12c3-.5 5 0 6 1.5z"/>
    <path d="M9 15V4c1-1.5 3-2 6-1.5v12c-3-.5-5 0-6 1.5z"/>
    <line x1="9" y1="4" x2="9" y2="15"/>
  </svg>
);
const IcoUser = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="6" r="4"/>
    <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="7.5" r="5.5"/>
    <line x1="11.5" y1="11.5" x2="16" y2="16"/>
  </svg>
);
const IcoLibrary = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 2h2v14H3z"/>
    <path d="M7 2h2v14H7z"/>
    <path d="M11.5 2.5l1.93.52L9.5 15.5l-1.93-.52z"/>
    <path d="M15 2h2v14h-2z"/>
  </svg>
);

/* ── بيانات القائمة الجانبية — 6 أقسام ── */
const DRAWER_GROUPS: NavGroup[] = [
  {
    id: "home",
    title: "الرئيسية",
    icon: <IcoHome />,
    items: [
      { href: "/",        label: seoNavLabel("/", "الصفحة الرئيسية"),    Icon: Home },
      { href: "/updates", label: seoNavLabel("/updates", "آخر المستجدات"),       Icon: Rss },
      { href: "/calendar", label: seoNavLabel("/calendar", "تقويم الدروس"),     Icon: Calendar,  desc: "التقويم والمناسبات الإسلامية" },
      { href: "/occasions", label: seoNavLabel("/occasions", "المناسبات الإسلامية"), Icon: Star,     desc: "أذكار المناسبات والأعياد" },
      { href: "/about",   label: seoNavLabel("/about", "من نحن"),           Icon: HelpCircle, desc: "تعرّف على المجلس العلمي" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    icon: <IcoQuran />,
    items: [
      { href: "/quran-hub",           label: seoNavLabel("/quran-hub", "مركز القرآن"),        Icon: Layers,        desc: "بوابة كل ما يتعلق بالقرآن" },
      { href: "/mushaf",              label: seoNavLabel("/mushaf", "المصحف الشريف"),      Icon: BookOpen,      desc: "اقرأ القرآن الكريم كاملاً" },
      { href: "/quran/surahs",        label: seoNavLabel("/quran/surahs", "فهرس السور"),         Icon: BookText,      desc: "دليل 114 سورة بالبحث والفلاتر" },
      { href: "/daily-wird",          label: seoNavLabel("/daily-wird", "الورد اليومي"),       Icon: Sun,           desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",       label: seoNavLabel("/quran/tajweed", "علم التجويد"),        Icon: Mic2,          desc: "أحكام التجويد بالأمثلة" },
      { href: "/ulum-quran",          label: seoNavLabel("/ulum-quran", "علوم القرآن الكريم"),        Icon: GraduationCap, desc: "التفسير والناسخ والمنسوخ" },
      { href: "/tafsir",              label: seoNavLabel("/tafsir", "علم التفسير"),           Icon: BookOpen,      desc: "أنواع التفسير وأصوله وكتب المفسرين" },
      { href: "/quran/surah-stories", label: seoNavLabel("/quran/surah-stories", "قصص السور"),          Icon: BookText,      desc: "أسباب النزول ومحاور السور" },
      { href: "/duas-quran",          label: seoNavLabel("/duas-quran", "أدعية القرآن"),       Icon: BookMarked,    desc: "الأدعية القرآنية المختارة" },
      { href: "/quran-memorization",  label: seoNavLabel("/quran-memorization", "اختبارات الحفظ"),     Icon: Zap,           desc: "12 نوعًا من اختبارات الحفظ" },
      { href: "/quran/memorization-plans", label: seoNavLabel("/quran/memorization-plans", "خطط الحفظ"),     Icon: CalendarDays,  desc: "خطط مرنة للحفظ والمراجعة والتثبيت" },
      { href: "/mutashabihat",        label: seoNavLabel("/mutashabihat", "الآيات المتشابهات"),  Icon: GitBranch,     desc: "تمييز الآيات المتشابهة لفظًا" },
    ],
  },
  {
    id: "search",
    title: "ابحث",
    icon: <IcoSearch />,
    items: [
      { href: "/search",              label: seoNavLabel("/search", "البحث الشامل"),        Icon: Search,    desc: "ابحث في كل محتوى التطبيق · Ctrl+K" },
      { href: "/flashcards",          label: seoNavLabel("/flashcards", "بطاقات المراجعة"), Icon: CreditCard, desc: "مراجعة بالتكرار المتباعد · Ctrl+Shift+R" },
      { href: "/academic-research",   label: seoNavLabel("/academic-research", "الأبحاث الشرعية"),    Icon: FileText,  desc: "مكتبة أبحاث ودراسات شرعية موثّقة" },
      { href: "/knowledge-graph",     label: seoNavLabel("/knowledge-graph", "استكشف المعرفة"),      Icon: Network,   desc: "شبكة المعرفة والخريطة المعرفية" },
      { href: "/islamic-glossary",    label: seoNavLabel("/islamic-glossary", "المصطلحات الإسلامية"), Icon: BookOpen,  desc: "معجم المصطلحات الفقهية" },
    ],
  },
  {
    id: "library",
    title: "المكتبة",
    icon: <IcoLibrary />,
    items: [
      { href: "/library",       label: seoNavLabel("/library", "المكتبة العلمية"),     Icon: Library,    desc: "كتب ومخطوطات إسلامية" },
      { href: "/scholars",      label: seoNavLabel("/scholars", "أعلام الإسلام"),       Icon: BookUser,   desc: "تراجم العلماء والمشايخ" },
      { href: "/institutions",       label: seoNavLabel("/institutions", "المؤسسات الإسلامية"),  Icon: Landmark,   desc: "مساجد · مكتبات · مراكز · جامعات" },
      { href: "/islamic-landmarks",  label: seoNavLabel("/islamic-landmarks", "المشاهد والمساجد"),    Icon: MapPin,     desc: "خريطة المشاهد الإسلامية التاريخية" },
    ],
  },
];

const VISIBLE_DRAWER_GROUPS: NavGroup[] = DRAWER_GROUPS.map((g) => ({
  ...g,
  items: g.items ? filterNavItems(g.items) : undefined,
  subGroups: g.subGroups?.map((sg) => ({
    ...sg,
    items: filterNavItems(sg.items),
  })),
}));

/* خريطة: href → id المجموعة */
const HREF_TO_GROUP: Record<string, string> = {};
VISIBLE_DRAWER_GROUPS.forEach(g => {
  if (g.items) {
    g.items.forEach(item => { HREF_TO_GROUP[item.href] = g.id; });
  }
  if (g.subGroups) {
    g.subGroups.forEach(sg => {
      sg.items.forEach(item => { HREF_TO_GROUP[item.href] = g.id; });
    });
  }
});

function getActiveGroup(pathname: string): string {
  if (pathname === "/") return "home";
  for (const [href, gid] of Object.entries(HREF_TO_GROUP)) {
    if (href !== "/" && (pathname === href || pathname.startsWith(href + "/"))) return gid;
  }
  return "home";
}

/* ── مكوّن القسم الفرعي داخل "تعلّم" ── */
function SubGroupSection({
  subGroup,
  isActive,
  onClose,
  defaultOpen,
  onSoonClick,
}: {
  subGroup: SubGroup;
  isActive: (href: string) => boolean;
  onClose: () => void;
  defaultOpen: boolean;
  onSoonClick: (label: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="side-nav-subgroup">
      <button
        type="button"
        className="side-nav-subgroup__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{subGroup.title}</span>
        {open
          ? <ChevronUp size={12} strokeWidth={2.5} aria-hidden="true" />
          : <ChevronDown size={12} strokeWidth={2.5} aria-hidden="true" />}
      </button>
      {open && (
        <nav className="side-nav-subgroup__items" aria-label={subGroup.title}>
          {subGroup.items.map(({ href, label, Icon, desc }) => (
            <Link
              key={href}
              href={href}
              onClick={isComingSoonPath(href) ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
              className={`side-nav-link side-nav-link--v2${isActive(href) ? " is-active" : ""}`}
              aria-label={isComingSoonPath(href) ? `${label} — قريبًا` : label}
            >
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
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
      )}
    </div>
  );
}

export function SideNavDrawer({ open, onClose, onLogout }: DrawerProps) {
  const [pathname] = useLocation();
  const { isAdmin, isLoggedIn, user } = useAuth();

  const activeGroup = useMemo(() => getActiveGroup(pathname), [pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(["home", activeGroup]);
  });

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // إغلاق Escape يُعالَج مركزيًا في useMobileNavState (مستمع عام على window)
  // — لا حاجة لمستمع محلي مكرر هنا.

  // إمكانية الوصول: أعِد التركيز إلى العنصر الذي فتح القائمة (زر الهامبرغر
  // عادةً) عند الإغلاق، بدل فقدان التركيز أو بقائه على عنصر أُزيل من DOM.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    } else {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  // سحب لليمين (فعليًا) يُغلق الدرج — إعادة استخدام أداة السحب الموجودة
  // (usePageSwipe، مُستخدَمة أصلاً لتقليب صفحات المصحف) بلا آلية جديدة.
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
      {/* onClick هنا لمنع انتشار النقر إلى الخلفية (button حقيقي أعلاه، مغلِق
          فعليًا وقابل للوصول بلوحة المفاتيح أصلًا) — لا إجراء مستقل هنا. */}
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
        {/* Header */}
        <div className="side-nav-drawer__head side-nav-drawer__head--v2">
          <div className="side-nav-drawer__brand">
            <img
              src="/logo-calligraphy.png"
              alt="المجلس العلمي"
              style={{ height: 36, maxWidth: 150, width: "auto", objectFit: "contain", borderRadius: 5 }}
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
            const hasActive = group.items
              ? group.items.some(i => isActive(i.href))
              : (group.subGroups ?? []).some(sg => sg.items.some(i => isActive(i.href)));

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
                    {/* مجموعة بعناصر مسطحة */}
                    {group.items && (
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
                    )}
                    {/* مجموعة بأقسام فرعية (تعلّم) */}
                    {group.subGroups && (
                      <div className="side-nav-subgroups-wrap">
                        {group.subGroups.map(sg => (
                          <SubGroupSection
                            key={sg.id}
                            subGroup={sg}
                            isActive={isActive}
                            onClose={onClose}
                            defaultOpen={sg.items.some(i => isActive(i.href))}
                            onSoonClick={onSoonClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* حسابي */}
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
