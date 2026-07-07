"use client";

import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

/* ─── أيقونات SVG مخصصة لكل قسم ─── */
function IconQuran()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M12 6v12M9 8l3 2 3-2"/></svg>; }
function IconLessons()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function IconCircles()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconLibrary()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h6"/></svg>; }
function IconHadith()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M9 9h6M9 13h4"/></svg>; }
function IconFiqh()       { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>; }
function IconQA()         { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconAdhkar()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="4"/></svg>; }
function IconPrayer()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>; }
function IconTasbih()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h10M12 7v10"/></svg>; }
function IconMiracles()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>; }
function IconStories()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>; }
function IconSeerah()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconQuiz()       { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function IconAssistant()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>; }
function IconCalendar()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconFlashcards() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function IconLearning()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconSearch()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconUniversities(){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconSettings()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconResearch()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/><circle cx="15" cy="15" r="2"/><path d="M20 20l-2.5-2.5"/></svg>; }
function IconRadio()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.01c0-5.65-7.52-8.44-10.26-3.79C8.74 8.44 4 8 4 8"/><rect x="2" y="8" width="20" height="14" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="14" r="1" fill="currentColor"/></svg>; }
function IconFawaid()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>; }
function IconProphets()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>; }
function IconTawhid()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>; }
function IconCouncil()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function IconMedicine()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8a4 4 0 108 0 4 4 0 00-8 0z"/><path d="M3 21c0-4 2-7 9-7s9 3 9 7"/><path d="M12 14v7"/></svg>; }
function IconQibla()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><path d="M12 8l2 4-2 4-2-4z" fill="currentColor" stroke="none"/></svg>; }
function IconGraph()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 5h10M6.3 7.2L10.5 17M17.7 7.2L13.5 17"/></svg>; }
function IconOccasions()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.5 5h5l-4 3 1.5 5L12 12l-4 3 1.5-5-4-3h5z"/></svg>; }

const SHEET_SECTIONS = [
  { group: "القرآن الكريم", items: [
    { href: "/quran",            label: "المصحف",         Icon: IconQuran },
    { href: "/quran-circles",    label: "حلقات التحفيظ",  Icon: IconCircles },
    { href: "/quran-radio",      label: "إذاعة القرآن",   Icon: IconRadio },
    { href: "/quran/tajweed",    label: "التجويد",        Icon: IconLessons },
  ]},
  { group: "المحتوى العلمي", items: [
    { href: "/lessons",          label: "الدروس",            Icon: IconLessons },
    { href: "/annual-courses",   label: "الدورات",           Icon: IconLessons },
    { href: "/library",          label: "المكتبة",           Icon: IconLibrary },
    { href: "/hadith",           label: "الأحاديث",          Icon: IconHadith },
    { href: "/fawaid",           label: "الفوائد",           Icon: IconFawaid },
    { href: "/stories",          label: "القصص الإسلامية",   Icon: IconStories },
    { href: "/islamic-stories",  label: "صحابة وفتوحات",     Icon: IconStories },
    { href: "/prophets",         label: "قصص الأنبياء",      Icon: IconProphets },
    { href: "/seerah",           label: "السيرة النبوية",     Icon: IconSeerah },
    { href: "/miracles",         label: "الإعجاز العلمي",    Icon: IconMiracles },
    { href: "/prophetic-medicine", label: "الطب النبوي",     Icon: IconMedicine },
  ]},
  { group: "الأحكام والفقه", items: [
    { href: "/qa",                  label: "الأسئلة",         Icon: IconQA },
    { href: "/fiqh",                label: "الفقه",           Icon: IconFiqh },
    { href: "/fatwa",               label: "الفتاوى",         Icon: IconFiqh },
    { href: "/rulings",             label: "الأحكام",         Icon: IconFiqh },
    { href: "/tawhid",              label: "التوحيد",         Icon: IconTawhid },
    { href: "/fiqh-council",        label: "المجمع الفقهي",   Icon: IconCouncil },
    { href: "/scholarly-research",  label: "الباحث الشرعي",   Icon: IconResearch },
    { href: "/academic-research",   label: "الأبحاث العلمية", Icon: IconResearch },
  ]},
  { group: "العبادة والأذكار", items: [
    { href: "/adhkar",           label: "الأذكار",           Icon: IconAdhkar },
    { href: "/tasbih",           label: "التسبيح",           Icon: IconTasbih },
    { href: "/prayer-countdown", label: "عداد الصلاة",       Icon: IconPrayer },
    { href: "/prayer-times",     label: "مواقيت الصلاة",     Icon: IconCalendar },
    { href: "/daily-wird",       label: "الورد اليومي",      Icon: IconAdhkar },
    { href: "/qibla",            label: "القبلة",            Icon: IconQibla },
    { href: "/occasions",        label: "المناسبات الإسلامية", Icon: IconOccasions },
  ]},
  { group: "التعلّم والأدوات", items: [
    { href: "/flashcards",       label: "البطاقات",          Icon: IconFlashcards },
    { href: "/learning-plan",    label: "خطة التعلّم",       Icon: IconLearning },
    { href: "/learning-path",    label: "خارطة طالب العلم",  Icon: IconLearning },
    { href: "/knowledge-graph",  label: "خارطة المعرفة",     Icon: IconGraph },
    { href: "/quiz",             label: "سؤال وجواب",        Icon: IconQuiz },
    { href: "/assistant",        label: "المساعد",           Icon: IconAssistant },
    { href: "/search",           label: "البحث",             Icon: IconSearch },
    { href: "/calendar",         label: "التقويم",           Icon: IconCalendar },
    { href: "/universities",     label: "الجامعات",          Icon: IconUniversities },
    { href: "/features-in-progress", label: "مميزات قيد التطوير", Icon: IconSettings },
    { href: "/settings",         label: "الإعدادات",         Icon: IconSettings },
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
          >✕</button>
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
                      <span className="more-sheet-item__icon">
                        <Icon />
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
