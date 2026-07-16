import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  Activity, BarChart2, BarChart3, BookMarked, BookOpen, BookText, BookUser,
  Bot, Building2, Calculator, Calendar, CalendarDays, CheckCircle2, Clock, Compass, CreditCard,
  FileText, Gavel, GitBranch, GraduationCap, Heart, HelpCircle, Info, Landmark,
  Layers, Library, Lightbulb, Map, Mic, Mic2, Microscope, Moon, Network,
  Quote, Radio, RefreshCw, Repeat2, Rss, Scale, ScrollText, Search, Settings,
  Shield, Sparkles, Star, Stethoscope, Sun, Tv, Users, X, Zap,
} from "lucide-react";

const SHEET_SECTIONS = [
  /* ── القرآن الكريم ── */
  { group: "القرآن الكريم", items: [
    { href: "/mushaf",              label: "المصحف الشريف",      Icon: BookOpen },
    { href: "/quran-hub",           label: "مركز القرآن",        Icon: Layers },
    { href: "/daily-wird",          label: "الورد اليومي",       Icon: Sun },
    { href: "/quran/tajweed",       label: "علم التجويد",        Icon: Mic2 },
    { href: "/ulum-quran",          label: "علوم القرآن",        Icon: GraduationCap },
    { href: "/quran/surah-stories", label: "قصص السور",          Icon: BookText },
    { href: "/duas-quran",          label: "أدعية القرآن",       Icon: BookMarked },
    { href: "/quran-radio",         label: "إذاعة القرآن",       Icon: Radio },
    { href: "/quran-live",          label: "البث المباشر",       Icon: Tv },
    { href: "/quran-circles",       label: "حلقات التحفيظ",      Icon: Users },
    { href: "/quran-memorization",  label: "اختبارات الحفظ",     Icon: Zap },
    { href: "/mutashabihat",        label: "الآيات المتشابهات",  Icon: GitBranch },
    { href: "/muezzins",            label: "مكتبة المؤذنين",     Icon: Mic },
  ]},

  /* ── الحديث والسنة ── */
  { group: "الحديث والسنة", items: [
    { href: "/hadith",             label: "الأحاديث النبوية",    Icon: ScrollText },
    { href: "/arbaeen-nawawi",     label: "الأربعون النووية",    Icon: FileText },
    { href: "/hadith-science",     label: "مصطلح الحديث",        Icon: BookOpen },
    { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",     Icon: Star },
    { href: "/prophetic-medicine", label: "الطب النبوي",         Icon: Stethoscope },
    { href: "/shamael",            label: "الشمائل المحمدية",    Icon: BookUser },
  ]},

  /* ── العقيدة والتوحيد ── */
  { group: "العقيدة والتوحيد", items: [
    { href: "/tawhid",      label: "التوحيد والعقيدة",     Icon: Shield },
    { href: "/arkan",       label: "أركان الإسلام",        Icon: Landmark },
    { href: "/arkan-iman",  label: "أركان الإيمان",        Icon: Star },
    { href: "/asma-husna",  label: "الأسماء الحسنى",       Icon: Sparkles },
    { href: "/janna-naar",  label: "الجنة والنار",         Icon: Sparkles },
    { href: "/alamat-saah", label: "علامات الساعة",        Icon: Clock },
    { href: "/malaika",     label: "الملائكة في الإسلام",  Icon: Sparkles },
    { href: "/miracles",    label: "الإعجاز العلمي",       Icon: Lightbulb },
  ]},

  /* ── الفقه والأحكام ── */
  { group: "الفقه والأحكام", items: [
    { href: "/fiqh",               label: "الفقه الإسلامي",     Icon: BookText },
    { href: "/qa",                 label: "الأسئلة والأجوبة",   Icon: HelpCircle },
    { href: "/fatwa",              label: "الفتاوى",             Icon: Scale },
    { href: "/rulings",            label: "الأحكام الشرعية",    Icon: Gavel },
    { href: "/fiqh-council",       label: "المجمع الفقهي",      Icon: Users },
    { href: "/madhahib",           label: "المذاهب الأربعة",    Icon: Scale },
    { href: "/islamic-sects",      label: "الفرق الإسلامية",    Icon: Scale },
    { href: "/fiqh-qawaid",        label: "القواعد الفقهية",    Icon: Scale },
    { href: "/tahara",             label: "الطهارة وأحكامها",   Icon: Repeat2 },
    { href: "/salah-guide",        label: "دليل الصلاة الكامل", Icon: BookOpen },
    { href: "/zakat",              label: "الزكاة وأحكامها",    Icon: Calculator },
    { href: "/sawm",               label: "الصيام وأحكامه",     Icon: Moon },
    { href: "/hajj",               label: "الحج والعمرة",       Icon: Landmark },
    { href: "/janaza",             label: "أحكام الجنائز",      Icon: ScrollText },
    { href: "/mawarith",           label: "المواريث والفرائض",  Icon: Scale },
    { href: "/mawarith/calculator", label: "حاسبة المواريث",    Icon: Calculator },
    { href: "/scholarly-research", label: "الباحث الشرعي",     Icon: Microscope },
    { href: "/academic-research",  label: "الأبحاث العلمية",   Icon: FileText },
  ]},

  /* ── العبادة والأذكار ── */
  { group: "العبادة والأذكار", items: [
    { href: "/adhkar",            label: "الأذكار",              Icon: Repeat2 },
    { href: "/duas",              label: "الأدعية الشرعية",     Icon: BookMarked },
    { href: "/tasbih",            label: "التسبيح",              Icon: Repeat2 },
    { href: "/sunan-yawmiyya",    label: "السنن اليومية",        Icon: CheckCircle2 },
    { href: "/prayer-ranks",      label: "فضائل الصلاة",        Icon: Shield },
    { href: "/prayer-times",      label: "مواقيت الصلاة",       Icon: Clock },
    { href: "/prayer-countdown",  label: "عداد الصلاة",         Icon: Activity },
    { href: "/qibla",             label: "القبلة",               Icon: Compass },
    { href: "/occasions",         label: "المناسبات الإسلامية",  Icon: Calendar },
    { href: "/tawba",             label: "التوبة والاستغفار",   Icon: RefreshCw },
    { href: "/raqaiq",            label: "الرقائق والزهد",      Icon: Heart },
  ]},

  /* ── السيرة والتاريخ ── */
  { group: "السيرة والتاريخ", items: [
    { href: "/seerah",          label: "السيرة النبوية",         Icon: BookUser },
    { href: "/sahabah",         label: "الصحابة الكرام",         Icon: Users },
    { href: "/prophets",        label: "الأنبياء والرسل",         Icon: Star },
    { href: "/stories",            label: "القصص الإسلامية",     Icon: BookOpen },
    { href: "/islamic-landmarks",  label: "المشاهد والمساجد",    Icon: Landmark },
  ]},

  /* ── الدروس والمكتبة ── */
  { group: "الدروس والمكتبة", items: [
    { href: "/lessons",          label: "الدروس والمحاضرات",    Icon: GraduationCap },
    { href: "/annual-courses",   label: "الدورات العلمية",      Icon: BookMarked },
    { href: "/library",          label: "المكتبة الشرعية",      Icon: Library },
    { href: "/scholars",         label: "أعلام الإسلام",        Icon: BookUser },
    { href: "/fawaid",           label: "الفوائد العلمية",      Icon: Heart },
    { href: "/hikam-salaf",      label: "حكم السلف الصالح",     Icon: Star },
    { href: "/fadail-aamal",     label: "فضائل الأعمال",        Icon: Star },
    { href: "/akhlaq",           label: "الأخلاق الإسلامية",    Icon: Heart },
    { href: "/adab-talab-ilm",   label: "آداب طالب العلم",      Icon: GraduationCap },
    { href: "/islamic-glossary", label: "المصطلحات الإسلامية",  Icon: BookOpen },
    { href: "/islam-stats",      label: "الإسلام في أرقام",     Icon: BarChart3 },
    { href: "/updates",          label: "آخر المستجدات",        Icon: Rss },
  ]},

  /* ── التعلّم والأدوات ── */
  { group: "التعلّم والأدوات", items: [
    { href: "/quiz",                 label: "المسابقة التعليمية",  Icon: Zap },
    { href: "/flashcards",           label: "بطاقات المراجعة",     Icon: CreditCard },
    { href: "/assistant",            label: "المساعد الذكي",       Icon: Bot },
    { href: "/mind-map",             label: "الخرائط الذهنية",    Icon: Map },
    { href: "/learning-plan",        label: "خطة التعلّم",         Icon: BarChart2 },
    { href: "/learning/paths",       label: "المسارات العلمية",    Icon: GraduationCap },
    { href: "/my-learning",          label: "لوحتي التعليمية",    Icon: BarChart3 },
    { href: "/my-citations",         label: "دفتر الفوائد",       Icon: Quote },
    { href: "/reading-plans",        label: "خطط القراءة",        Icon: CalendarDays },
    { href: "/knowledge-map",        label: "الخريطة المعرفية",   Icon: Network },
    { href: "/knowledge-graph",      label: "شبكة المعرفة",       Icon: GitBranch },
    { href: "/calendar",             label: "التقويم الهجري",     Icon: Calendar },
    { href: "/universities",         label: "دليل الجامعات",      Icon: Building2 },
    { href: "/search",               label: "البحث الشامل",       Icon: Search },
    { href: "/settings",             label: "الإعدادات",          Icon: Settings },
    { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: Layers },
    { href: "/about",                label: "عن التطبيق",         Icon: Info },
  ]},
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const [location] = useLocation();

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

  return createPortal(
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
          {SHEET_SECTIONS.map((section) => (
            <div key={section.group} className="bottom-sheet__section">
              <p className="bottom-sheet__section-label">
                {section.group}
              </p>
              <div className="bottom-sheet__grid">
                {section.items.map(({ href, label, Icon }) => {
                  const active = location === href || (href !== "/" && location.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={`more-sheet-item${active ? " more-sheet-item--active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="more-sheet-item__icon" aria-hidden="true">
                        <Icon size={20} strokeWidth={1.8} />
                      </span>
                      <span>{label}</span>
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
