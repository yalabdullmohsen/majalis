"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  Activity, BarChart3, BookOpen, Bot, Building2, Calculator, Calendar, CheckCircle2, Compass, CreditCard,
  FileText, GraduationCap, Heart, HelpCircle, Info, Landmark, Library, Layers,
  Mic, Moon, Network, Radio, RefreshCw, Repeat2, Scale, ScrollText, Search, Settings,
  Shield, Sparkles, Star, Stethoscope, Tv, Users, X, Zap,
} from "lucide-react";

const SHEET_SECTIONS = [
  { group: "القرآن الكريم", items: [
    { href: "/quran-hub",           label: "مركز القرآن",      Icon: Layers },
    { href: "/quran",               label: "المصحف",           Icon: BookOpen },
    { href: "/quran-circles",       label: "حلقات التحفيظ",    Icon: Users },
    { href: "/quran-radio",         label: "إذاعة القرآن",     Icon: Radio },
    { href: "/quran/surah-stories", label: "قصص القرآن",       Icon: BookOpen },
    { href: "/quran-live",          label: "البث المباشر",     Icon: Tv },
    { href: "/quran/tajweed",       label: "التجويد",          Icon: GraduationCap },
    { href: "/muezzins",            label: "مكتبة المؤذنين",   Icon: Mic },
  ]},
  { group: "المحتوى العلمي", items: [
    { href: "/lessons",            label: "الدروس",            Icon: GraduationCap },
    { href: "/annual-courses",     label: "الدورات",           Icon: GraduationCap },
    { href: "/library",            label: "المكتبة",           Icon: Library },
    { href: "/scholars",           label: "أعلام الإسلام",     Icon: Users },
    { href: "/asma-husna",         label: "الأسماء الحسنى",   Icon: Sparkles },
    { href: "/akhlaq",             label: "الأخلاق الإسلامية", Icon: Heart },
    { href: "/arkan",              label: "أركان الإسلام",      Icon: Landmark },
    { href: "/arkan-iman",         label: "أركان الإيمان",      Icon: Star },
    { href: "/hadith",             label: "الأحاديث",           Icon: ScrollText },
    { href: "/hadith-science",     label: "مصطلح الحديث",       Icon: BookOpen },
    { href: "/arbaeen-nawawi",     label: "الأربعون النووية",  Icon: FileText },
    { href: "/fawaid",             label: "الفوائد",           Icon: Heart },
    { href: "/hikam-salaf",        label: "حكم السلف",         Icon: BookOpen },
    { href: "/fadail-aamal",       label: "فضائل الأعمال",     Icon: Star },
    { href: "/updates",            label: "آخر المستجدات",     Icon: RefreshCw },
    { href: "/stories",            label: "القصص الإسلامية",   Icon: BookOpen },
    { href: "/islamic-stories",    label: "صحابة وفتوحات",     Icon: BookOpen },
    { href: "/prophets",           label: "قصص الأنبياء",      Icon: Layers },
    { href: "/seerah",             label: "السيرة النبوية",    Icon: Shield },
    { href: "/miracles",           label: "الإعجاز العلمي",    Icon: Sparkles },
    { href: "/prophetic-medicine", label: "الطب النبوي",       Icon: Stethoscope },
  ]},
  { group: "الأحكام والفقه", items: [
    { href: "/qa",                  label: "الأسئلة",         Icon: HelpCircle },
    { href: "/madhahib",            label: "المذاهب الأربعة",  Icon: Scale },
    { href: "/zakat",               label: "الزكاة وأحكامها",  Icon: Calculator },
    { href: "/sawm",                label: "الصيام وأحكامه",   Icon: Moon },
    { href: "/hajj",                label: "الحج والعمرة",     Icon: Landmark },
    { href: "/tahara",              label: "الطهارة وأحكامها", Icon: Repeat2 },
    { href: "/fiqh",                label: "الفقه",           Icon: Scale },
    { href: "/fatwa",               label: "الفتاوى",         Icon: Scale },
    { href: "/rulings",             label: "الأحكام",         Icon: Scale },
    { href: "/tawhid",              label: "التوحيد",         Icon: Landmark },
    { href: "/fiqh-council",        label: "المجمع الفقهي",   Icon: Users },
    { href: "/scholarly-research",  label: "الباحث الشرعي",   Icon: Search },
    { href: "/academic-research",   label: "الأبحاث العلمية", Icon: FileText },
  ]},
  { group: "العبادة والأذكار", items: [
    { href: "/adhkar",           label: "الأذكار",             Icon: Repeat2 },
    { href: "/sunan-yawmiyya",   label: "السنن اليومية",       Icon: CheckCircle2 },
    { href: "/duas",             label: "الأدعية الشرعية",    Icon: Repeat2 },
    { href: "/tasbih",           label: "التسبيح",             Icon: Repeat2 },
    { href: "/prayer-countdown", label: "عداد الصلاة",         Icon: Activity },
    { href: "/prayer-times",     label: "مواقيت الصلاة",       Icon: Calendar },
    { href: "/daily-wird",       label: "الورد اليومي",        Icon: Repeat2 },
    { href: "/prayer-ranks",     label: "فضائل الصلاة",        Icon: Shield },
    { href: "/qibla",            label: "القبلة",              Icon: Compass },
    { href: "/occasions",        label: "المناسبات الإسلامية", Icon: Calendar },
  ]},
  { group: "التعلّم والأدوات", items: [
    { href: "/flashcards",           label: "البطاقات",               Icon: CreditCard },
    { href: "/learning-plan",        label: "خطة التعلّم",            Icon: Activity },
    { href: "/learning-path",        label: "خارطة طالب العلم",       Icon: Activity },
    { href: "/my-learning",          label: "لوحتي التعليمية",        Icon: BarChart3 },
    { href: "/knowledge-map",        label: "الخريطة المعرفية 2.0",   Icon: Network },
    { href: "/knowledge-graph",      label: "شبكة المعرفة",          Icon: Network },
    { href: "/quiz",                 label: "سؤال وجواب",             Icon: Zap },
    { href: "/assistant",            label: "المساعد",                Icon: Bot },
    { href: "/search",               label: "البحث",                  Icon: Search },
    { href: "/calendar",             label: "التقويم",                Icon: Calendar },
    { href: "/universities",         label: "الجامعات",               Icon: Building2 },
    { href: "/features-in-progress", label: "مميزات قيد التطوير",     Icon: Settings },
    { href: "/settings",             label: "الإعدادات",              Icon: Settings },
    { href: "/about",                label: "عن التطبيق",             Icon: Info },
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
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
