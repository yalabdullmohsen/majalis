"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  BookOpen, Briefcase, Building2, FlaskConical, Globe,
  GraduationCap, Landmark, Layers, Library, Moon, PenLine, Scale, ScrollText, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = "theses" | "institutions" | "personal";

const TABS: { id: Tab; label: string; Icon: LucideIcon; desc: string }[] = [
  { id: "theses",       label: "الرسائل العلمية",       Icon: GraduationCap, desc: "رسائل الماجستير والدكتوراه" },
  { id: "institutions", label: "أبحاث المؤسسات",        Icon: Landmark,      desc: "أبحاث المنظمات والمراكز والجامعات" },
  { id: "personal",    label: "الأبحاث الشخصية",       Icon: PenLine,       desc: "أبحاث الأعضاء والباحثين" },
];

const THESIS_CATEGORIES: { Icon: LucideIcon; label: string }[] = [
  { Icon: BookOpen,     label: "الفقه وأصوله" },
  { Icon: Moon,         label: "الحديث وعلومه" },
  { Icon: Layers,       label: "العقيدة والكلام" },
  { Icon: ScrollText,   label: "التفسير وعلوم القرآن" },
  { Icon: Scale,        label: "الفقه المقارن" },
  { Icon: Landmark,     label: "السيرة والتاريخ الإسلامي" },
  { Icon: FlaskConical, label: "الإعجاز العلمي" },
  { Icon: Globe,        label: "الدعوة والتربية الإسلامية" },
];

const INSTITUTION_CATEGORIES: { Icon: LucideIcon; label: string }[] = [
  { Icon: GraduationCap, label: "الجامعات الإسلامية" },
  { Icon: Building2,     label: "المراكز البحثية" },
  { Icon: Globe,         label: "المنظمات الدولية" },
  { Icon: Library,       label: "مجامع الفقه" },
  { Icon: Landmark,      label: "دور الإفتاء" },
  { Icon: Briefcase,     label: "الهيئات الشرعية" },
];

function EmptyCard({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { Icon: LucideIcon; title: string; sub: string }> = {
    theses:       { Icon: GraduationCap, title: "لا توجد رسائل علمية بعد", sub: "سيتم إضافة الرسائل والأطروحات قريباً — يمكنك المساهمة بإرسال بحثك" },
    institutions: { Icon: Landmark,      title: "لا توجد أبحاث مؤسسية بعد", sub: "نعمل على تجميع أبحاث المراكز والجامعات الإسلامية" },
    personal:     { Icon: PenLine,       title: "لا توجد أبحاث شخصية بعد", sub: "شارك بحثك وأضفه لأرشيف المجلس العلمي" },
  };
  const m = msgs[tab];
  const I = m.Icon;
  return (
    <div className="ar-empty">
      <div className="ar-empty__icon" aria-hidden="true"><I size={44} strokeWidth={1.3} /></div>
      <p className="ar-empty__title">{m.title}</p>
      <p className="ar-empty__sub">{m.sub}</p>
      <Link href="/submit-content" className="ar-empty__btn">إرسال بحث</Link>
    </div>
  );
}

function ThesesTab() {
  const [search, setSearch] = useState("");
  return (
    <div className="ar-tab-body">
      <div className="ar-search-bar">
        <Search className="ar-search-bar__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          className="ar-search-bar__input"
          placeholder="ابحث في رسائل الماجستير والدكتوراه…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في الرسائل العلمية"
        />
      </div>

      <div className="ar-cats">
        <p className="ar-cats__label">تصفّح حسب التخصص</p>
        <div className="ar-cats__grid">
          {THESIS_CATEGORIES.map(c => (
            <button key={c.label} className="ar-cat-item" type="button">
              <span className="ar-cat-item__icon" aria-hidden="true">{(() => { const I = c.Icon; return <I size={16} strokeWidth={1.6} />; })()}</span>
              <span className="ar-cat-item__label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <EmptyCard tab="theses" />
    </div>
  );
}

function InstitutionsTab() {
  const [search, setSearch] = useState("");
  return (
    <div className="ar-tab-body">
      <div className="ar-search-bar">
        <Search className="ar-search-bar__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          className="ar-search-bar__input"
          placeholder="ابحث في أبحاث المؤسسات والجامعات…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في أبحاث المؤسسات"
        />
      </div>

      <div className="ar-cats">
        <p className="ar-cats__label">تصفّح حسب المؤسسة</p>
        <div className="ar-cats__grid">
          {INSTITUTION_CATEGORIES.map(c => (
            <button key={c.label} className="ar-cat-item" type="button">
              <span className="ar-cat-item__icon" aria-hidden="true">{(() => { const I = c.Icon; return <I size={16} strokeWidth={1.6} />; })()}</span>
              <span className="ar-cat-item__label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <EmptyCard tab="institutions" />
    </div>
  );
}

function PersonalTab() {
  return (
    <div className="ar-tab-body">
      <div className="ar-submit-prompt">
        <div className="ar-submit-prompt__icon" aria-hidden="true"><PenLine size={40} strokeWidth={1.3} /></div>
        <div className="ar-submit-prompt__body">
          <p className="ar-submit-prompt__title">شارك بحثك مع المجتمع العلمي</p>
          <p className="ar-submit-prompt__sub">يمكنك نشر أبحاثك ودراساتك وتلخيصاتك لتستفيد منها المجتمع المسلم حول العالم.</p>
          <Link href="/submit-content" className="ar-submit-prompt__btn">إضافة بحث</Link>
        </div>
      </div>
      <EmptyCard tab="personal" />
    </div>
  );
}

export default function AcademicResearchPage() {
  const [activeTab, setActiveTab] = useState<Tab>("theses");

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research",
      title: "الأبحاث العلمية الإسلامية | المجلس العلمي",
      description: "مستودع شامل للرسائل الجامعية وأبحاث المؤسسات والباحثين في العلوم الإسلامية — ماجستير ودكتوراه وبحوث متخصصة.",
      keywords: ["أبحاث إسلامية", "رسائل جامعية", "رسائل ماجستير", "رسائل دكتوراه", "بحوث شرعية"],
    });
  }, []);

  return (
    <div className="ar-page" dir="rtl">
      {/* رأس */}
      <div className="ar-hero">
        <div className="ar-hero__inner">
          <p className="ar-hero__eyebrow">المجلس العلمي</p>
          <h1 className="ar-hero__title">الأبحاث العلمية</h1>
          <p className="ar-hero__sub">
            مستودع شامل للرسائل الجامعية وأبحاث المراكز والجامعات والباحثين في العلوم الإسلامية
          </p>
        </div>
      </div>

      {/* إحصاءات */}
      <div className="ar-stats">
        {[
          { n: "قريباً", label: "رسالة علمية" },
          { n: "قريباً", label: "بحث مؤسسي" },
          { n: "قريباً", label: "باحث مشارك" },
        ].map(s => (
          <div key={s.label} className="ar-stat">
            <span className="ar-stat__n">{s.n}</span>
            <span className="ar-stat__lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* تبويبات */}
      <div className="ar-tabs-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`ar-tab-btn${activeTab === t.id ? " ar-tab-btn--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            aria-pressed={activeTab === t.id}
          >
            <span className="ar-tab-btn__icon" aria-hidden="true">{(() => { const I = t.Icon; return <I size={16} strokeWidth={1.6} />; })()}</span>
            <span className="ar-tab-btn__label">{t.label}</span>
            <span className="ar-tab-btn__sub">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* محتوى */}
      <div className="ar-content">
        {activeTab === "theses"       && <ThesesTab />}
        {activeTab === "institutions" && <InstitutionsTab />}
        {activeTab === "personal"     && <PersonalTab />}
      </div>

      {/* رابط الباحث الشرعي */}
      <div className="ar-footer-link">
        <Link href="/scholarly-research" className="ar-footer-link__btn">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          البحث بالذكاء الاصطناعي في المصادر الشرعية
        </Link>
      </div>
    </div>
  );
}
