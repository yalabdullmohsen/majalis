import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  Baby, BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Bot, Brain, Calculator, CalendarDays, CheckCircle2, Clock, Compass,
  FileText, GitBranch, GraduationCap, Heart, HelpCircle, Landmark,
  Layers, Map, MapPin, Mic2, Moon,
  Quote, RefreshCw, Repeat2, Scale, ScrollText, Search, Settings,
  Shield, Sparkles, Star, Stethoscope, Sun, Users, X, Zap,
} from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { filterNavItems, isComingSoonPath } from "@/lib/nav-visibility";
import { isNavHrefActive } from "@/lib/nav-active";
import "@/styles/components/more-bottom-sheet.css";

type SheetItem = { href: string; label: string; Icon: typeof BookOpen };

const SHEET_SECTIONS_RAW: { group: string; items: SheetItem[] }[] = [
  { group: "أقسام رئيسية", items: [
    { href: "/", label: seoNavLabel("/", "الرئيسية"), Icon: Layers },
    { href: "/mushaf", label: seoNavLabel("/mushaf", "القرآن"), Icon: BookOpen },
    { href: "/quran-knowledge", label: seoNavLabel("/quran-knowledge", "القرآن وعلومه"), Icon: BookMarked },
    { href: "/hadith", label: seoNavLabel("/hadith", "الحديث والسنة"), Icon: ScrollText },
    { href: "/fiqh", label: seoNavLabel("/fiqh", "الفقه والأحكام"), Icon: Scale },
    { href: "/memorization", label: seoNavLabel("/memorization", "الحفظ والمراجعة"), Icon: Brain },
    { href: "/occasions-lessons", label: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), Icon: CalendarDays },
    { href: "/islamic-directory", label: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), Icon: MapPin },
    { href: "/prayer-times", label: seoNavLabel("/prayer-times", "الصلاة"), Icon: Clock },
    { href: "/my-learning", label: seoNavLabel("/my-learning", "حسابي"), Icon: BarChart3 },
    { href: "/settings", label: seoNavLabel("/settings", "الإعدادات"), Icon: Settings },
  ]},

  { group: "القرآن الكريم", items: [
    { href: "/mushaf", label: seoNavLabel("/mushaf", "المصحف الشريف"), Icon: BookOpen },
    { href: "/quran-knowledge", label: seoNavLabel("/quran-knowledge", "القرآن وعلومه"), Icon: BookMarked },
    { href: "/memorization", label: seoNavLabel("/memorization", "الحفظ والمراجعة"), Icon: Brain },
    { href: "/quran/makki-madani", label: seoNavLabel("/quran/makki-madani", "المكي والمدني"), Icon: Map },
    { href: "/daily-wird", label: seoNavLabel("/daily-wird", "الورد اليومي"), Icon: Sun },
    { href: "/quran/tajweed", label: seoNavLabel("/quran/tajweed", "علم التجويد"), Icon: Mic2 },
    { href: "/tafsir", label: seoNavLabel("/tafsir", "علم التفسير"), Icon: BookOpen },
    { href: "/duas-quran", label: seoNavLabel("/duas-quran", "أدعية القرآن"), Icon: BookMarked },
    { href: "/mutashabihat", label: seoNavLabel("/mutashabihat", "الآيات المتشابهات"), Icon: GitBranch },
  ]},

  { group: "الحديث والسنة", items: [
    { href: "/hadith", label: seoNavLabel("/hadith", "الأحاديث النبوية"), Icon: ScrollText },
    { href: "/hadith/books-and-rulings", label: seoNavLabel("/hadith/books-and-rulings", "المتون الحديثية وأحاديث الأحكام"), Icon: FileText },
    { href: "/hadith-science", label: seoNavLabel("/hadith-science", "مصطلح الحديث"), Icon: BookOpen },
    { href: "/wasaya-nabawiyya", label: seoNavLabel("/wasaya-nabawiyya", "الوصايا النبوية"), Icon: Star },
    { href: "/prophetic-medicine", label: seoNavLabel("/prophetic-medicine", "الطب النبوي"), Icon: Stethoscope },
    { href: "/shamael", label: seoNavLabel("/shamael", "صفةُ سيِّد الخلقِ ﷺ"), Icon: BookUser },
  ]},

  { group: "العقيدة والتوحيد", items: [
    { href: "/tawhid", label: seoNavLabel("/tawhid", "التوحيد والعقيدة"), Icon: Shield },
    { href: "/arkan", label: seoNavLabel("/arkan", "أركان الإسلام الخمسة"), Icon: Landmark },
    { href: "/arkan-iman", label: seoNavLabel("/arkan-iman", "أركان الإيمان الستة"), Icon: Star },
    { href: "/asma-husna", label: seoNavLabel("/asma-husna", "الأسماء الحسنى"), Icon: Sparkles },
    { href: "/janna-naar", label: seoNavLabel("/janna-naar", "صفة الجنة"), Icon: Sparkles },
    { href: "/alamat-saah", label: seoNavLabel("/alamat-saah", "علامات الساعة"), Icon: Clock },
    { href: "/malaika", label: seoNavLabel("/malaika", "الملائكة في الإسلام"), Icon: Sparkles },
  ]},

  { group: "التعريف بالإسلام", items: [
    { href: "/discover-islam", label: seoNavLabel("/discover-islam", "تعرّف إلى الإسلام"), Icon: Compass },
    { href: "/discover-islam/questions", label: seoNavLabel("/discover-islam/questions", "أسئلة وأجوبة"), Icon: HelpCircle },
    { href: "/discover-islam/doubts", label: seoNavLabel("/discover-islam/doubts", "الشبهات والتفنيدات"), Icon: Shield },
    { href: "/discover-islam/how-to-convert", label: seoNavLabel("/discover-islam/how-to-convert", "كيف أصبح مسلمًا؟"), Icon: Star },
    { href: "/discover-islam/new-muslim", label: seoNavLabel("/discover-islam/new-muslim", "مسار المسلم الجديد"), Icon: Sparkles },
  ]},

  { group: "الفقه والأحكام", items: [
    { href: "/qa", label: seoNavLabel("/qa", "سؤال وجواب"), Icon: HelpCircle },
    { href: "/fiqh", label: seoNavLabel("/fiqh", "الفقه الإسلامي"), Icon: BookText },
    { href: "/fiqh-council", label: seoNavLabel("/fiqh-council", "المجمع الفقهي"), Icon: Users },
    { href: "/madhahib", label: seoNavLabel("/madhahib", "المذاهب الأربعة"), Icon: Scale },
    { href: "/islamic-sects", label: seoNavLabel("/islamic-sects", "الفرق الإسلامية"), Icon: Scale },
    { href: "/fiqh-qawaid", label: seoNavLabel("/fiqh-qawaid", "القواعد الفقهية"), Icon: Scale },
    { href: "/tahara", label: seoNavLabel("/tahara", "الطهارة وأحكامها"), Icon: Repeat2 },
    { href: "/salah-guide", label: seoNavLabel("/salah-guide", "دليل الصلاة الكامل"), Icon: BookOpen },
    { href: "/zakat", label: seoNavLabel("/zakat", "الزكاة وأحكامها"), Icon: Calculator },
    { href: "/sawm", label: seoNavLabel("/sawm", "الصيام وأحكامه"), Icon: Moon },
    { href: "/hajj", label: seoNavLabel("/hajj", "الحج والعمرة"), Icon: Landmark },
    { href: "/janaza", label: seoNavLabel("/janaza", "أحكام الجنائز"), Icon: ScrollText },
    { href: "/mawarith", label: seoNavLabel("/mawarith", "المواريث والفرائض"), Icon: Scale },
    { href: "/mawarith/calculator", label: seoNavLabel("/mawarith/calculator", "حاسبة المواريث"), Icon: Calculator },
    { href: "/amr-bil-maruf", label: seoNavLabel("/amr-bil-maruf", "الأمر بالمعروف"), Icon: Shield },
  ]},

  { group: "العبادة والأذكار", items: [
    { href: "/adhkar", label: seoNavLabel("/adhkar", "الأذكار والأدعية"), Icon: Repeat2 },
    { href: "/tasbih", label: seoNavLabel("/tasbih", "التسبيح"), Icon: Repeat2 },
    { href: "/sunan-yawmiyya", label: seoNavLabel("/sunan-yawmiyya", "السنن اليومية"), Icon: CheckCircle2 },
    { href: "/prayer-times", label: seoNavLabel("/prayer-times", "مواقيت الصلاة"), Icon: Clock },
    { href: "/qibla", label: seoNavLabel("/qibla", "القبلة"), Icon: Compass },
    { href: "/occasions-lessons", label: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), Icon: CalendarDays },
    { href: "/tawba", label: seoNavLabel("/tawba", "التوبة والاستغفار"), Icon: RefreshCw },
    { href: "/raqaiq", label: seoNavLabel("/raqaiq", "الرقائق والزهد"), Icon: Heart },
  ]},

  { group: "السيرة والتاريخ", items: [
    { href: "/seerah", label: seoNavLabel("/seerah", "السيرة النبوية"), Icon: BookUser },
    { href: "/sahabah", label: seoNavLabel("/sahabah", "الصحابة الكرام"), Icon: Users },
    { href: "/prophets", label: seoNavLabel("/prophets", "الأنبياء والرسل"), Icon: Star },
    { href: "/nations", label: seoNavLabel("/nations", "الأمم السابقة"), Icon: Landmark },
    { href: "/islamic-directory", label: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), Icon: MapPin },
  ]},

  { group: "الدروس والعلماء", items: [
    { href: "/lessons", label: seoNavLabel("/lessons", "الدروس"), Icon: GraduationCap },
    { href: "/lessons?tab=courses", label: seoNavLabel("/lessons?tab=courses", "الدورات العلمية"), Icon: BookMarked },
    { href: "/scholars", label: seoNavLabel("/scholars", "أعلام الإسلام"), Icon: BookUser },
    { href: "/fawaid", label: seoNavLabel("/fawaid", "الفوائد العلمية"), Icon: Heart },
    { href: "/hikam-salaf", label: seoNavLabel("/hikam-salaf", "حكم السلف الصالح"), Icon: Star },
    { href: "/fadail-aamal", label: seoNavLabel("/fadail-aamal", "فضائل الأعمال"), Icon: Star },
    { href: "/akhlaq", label: seoNavLabel("/akhlaq", "مكارم الأخلاق"), Icon: Heart },
    { href: "/adab-talab-ilm", label: seoNavLabel("/adab-talab-ilm", "آداب طالب العلم"), Icon: GraduationCap },
    { href: "/islamic-glossary", label: seoNavLabel("/islamic-glossary", "المصطلحات الإسلامية"), Icon: BookOpen },
  ]},

  { group: "أدوات ومزيد", items: [
    { href: "/my-learning", label: seoNavLabel("/my-learning", "حسابي"), Icon: BarChart3 },
    { href: "/learning/paths", label: seoNavLabel("/learning/paths", "المسارات العلمية"), Icon: GraduationCap },
    { href: "/quiz", label: seoNavLabel("/quiz", "لعبة سين جيم"), Icon: Zap },
    { href: "/assistant", label: seoNavLabel("/assistant", "المساعد العلمي"), Icon: Bot },
    { href: "/my-citations", label: seoNavLabel("/my-citations", "مكتبة الاقتباسات"), Icon: Quote },
    { href: "/reading-plans", label: seoNavLabel("/reading-plans", "خطط القراءة"), Icon: CalendarDays },
    { href: "/kids", label: seoNavLabel("/kids", "ركن الأطفال"), Icon: Baby },
    { href: "/search", label: seoNavLabel("/search", "البحث الشامل"), Icon: Search },
    { href: "/settings", label: seoNavLabel("/settings", "الإعدادات"), Icon: Settings },
  ]},
];

const SHEET_SECTIONS = SHEET_SECTIONS_RAW.map((section) => ({
  ...section,
  items: filterNavItems(section.items),
})).filter((section) => section.items.length > 0);

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const [location] = useLocation();
  const { resolvedTheme, toggleDark } = useThemePreference();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const onSoonClick = (label: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("global-coming-soon-open", { detail: { title: label } }));
  };

  return createPortal(
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التطبيق"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>قائمة التطبيق</span>
          <button
            type="button"
            onClick={onClose}
            className="bottom-sheet__close-btn"
            aria-label="إغلاق"
          ><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>
        </div>

        <div className="bottom-sheet__body">
          <button
            type="button"
            className="more-sheet-theme-toggle"
            onClick={toggleDark}
            aria-label={resolvedTheme === "dark" ? "التحويل إلى الوضع النهاري" : "التحويل إلى الوضع الليلي"}
          >
            <span className="more-sheet-theme-toggle__meta">
              {resolvedTheme === "dark"
                ? <Sun size={18} strokeWidth={1.8} aria-hidden="true" />
                : <Moon size={18} strokeWidth={1.8} aria-hidden="true" />}
              <span>{resolvedTheme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
            </span>
            <span aria-hidden="true">{resolvedTheme === "dark" ? "الوضع الحالي: ليلي" : "الوضع الحالي: نهاري"}</span>
          </button>
          {SHEET_SECTIONS.map((section) => (
            <div key={section.group} className="bottom-sheet__section">
              <p className="bottom-sheet__section-label">
                {section.group}
              </p>
              <div className="bottom-sheet__grid">
                {section.items.map(({ href, label, Icon }) => {
                  const active = isNavHrefActive(location, href);
                  const soon = isComingSoonPath(href);
                  return (
                    <Link
                      key={`${section.group}:${href}`}
                      href={href}
                      onClick={soon ? (e) => { e.preventDefault(); onSoonClick(label); } : onClose}
                      className={`more-sheet-item${active ? " more-sheet-item--active" : ""}${soon ? " more-sheet-item--soon" : ""}`}
                      aria-current={active ? "page" : undefined}
                      aria-label={soon ? `${label} — قريبًا` : label}
                    >
                      <span className="more-sheet-item__icon" aria-hidden="true">
                        <Icon size={20} strokeWidth={1.8} />
                      </span>
                      <span>
                        {label}
                        {soon ? <span className="nav-soon-badge">قريبًا</span> : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
