"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Bot,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Globe2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { fetchAboutPlatformStats, type AboutPlatformStats } from "@/lib/platform-about-stats";
import "@/styles/about-platform.css";

const FOUNDER_EMAIL = "yalabdullmohsen1@gmail.com";

const PLATFORM_IDEAS = [
  "الدروس العلمية",
  "حلقات القرآن",
  "المتون العلمية",
  "الأسئلة الشرعية",
  "الفوائد",
  "الأذكار",
  "الإعجاز العلمي",
  "الدورات العلمية",
  "البث المباشر",
  "الألعاب التعليمية الإسلامية",
  "المكتبة الإسلامية",
  "الفتاوى",
  "الأخبار العلمية",
];

const WHY_POINTS = [
  "جمع المحتوى العلمي الموثوق.",
  "تسهيل الوصول إلى العلماء والدروس.",
  "الاستفادة من الذكاء الاصطناعي في خدمة العلم.",
  "تقليل تشتت المحتوى الإسلامي.",
  "تقديم تجربة حديثة ومنظمة تناسب جميع المستخدمين.",
];

const TECHNOLOGIES = [
  { icon: Bot, label: "الذكاء الاصطناعي" },
  { icon: Cpu, label: "محرك المعرفة" },
  { icon: Search, label: "البحث الذكي" },
  { icon: Archive, label: "الأرشفة" },
  { icon: ShieldCheck, label: "التوثيق" },
  { icon: Upload, label: "الاستيراد الآلي" },
  { icon: Sparkles, label: "التحليل الذكي" },
  { icon: CheckCircle2, label: "نظام الجودة" },
  { icon: Globe2, label: "التحقق من المصادر" },
];

const FEATURES = [
  "محتوى موثق",
  "بحث ذكي",
  "تحديث مستمر",
  "ذكاء اصطناعي",
  "سرعة عالية",
  "يعمل على جميع الأجهزة",
  "واجهة سهلة",
  "مجاني للجميع",
];

function formatStat(value: number) {
  return value.toLocaleString("ar-EG");
}

export default function AboutPlatformPage() {
  const [stats, setStats] = useState<AboutPlatformStats | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    void fetchAboutPlatformStats().then((data) => {
      if (!cancelled) setStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(FOUNDER_EMAIL);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }, []);

  const statItems = stats
    ? [
        { label: "عدد الدروس", value: stats.lessonsCount },
        { label: "عدد العلماء", value: stats.sheikhsCount },
        { label: "عدد الكتب", value: stats.booksCount },
        { label: "عدد الفوائد", value: stats.fawaidCount },
        { label: "عدد الأسئلة", value: stats.qaCount },
        { label: "عدد حلقات القرآن", value: stats.quranCirclesCount },
        { label: "عدد المتون", value: stats.mutoonCount },
        { label: "عدد المستخدمين", value: stats.usersCount },
      ]
    : [];

  return (
    <div className="page-shell about-platform-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="عن المنصة"
        subtitle="منصة معرفية إسلامية تجمع العلم الموثوق والتقنية الحديثة في تجربة واحدة."
      />

      <div className="about-platform-layout">
        <section className="about-platform-section about-platform-section--hero ui-card" aria-labelledby="about-intro-heading">
          <p className="about-platform-eyebrow">القسم الأول</p>
          <h2 id="about-intro-heading" className="about-platform-heading">نبذة عن المنصة</h2>
          <p className="about-platform-lead">
            المجلس العلمي منصة علمية إسلامية متخصصة تهدف إلى جمع المحتوى الشرعي الموثوق في مكان واحد،
            مع توظيف التقنيات الحديثة والذكاء الاصطناعي لتسهيل الوصول إلى العلم الشرعي، وخدمة طلبة العلم،
            والدعاة، والعامة، من خلال تجربة استخدام سهلة وسريعة ومنظمة.
          </p>
        </section>

        <section className="about-platform-section ui-card" aria-labelledby="about-idea-heading">
          <p className="about-platform-eyebrow">القسم الثاني</p>
          <h2 id="about-idea-heading" className="about-platform-heading">فكرة المنصة</h2>
          <p className="about-platform-text">
            تقوم فكرة المجلس العلمي على بناء منصة معرفية متكاملة تجمع:
          </p>
          <ul className="about-platform-chip-list">
            {PLATFORM_IDEAS.map((item) => (
              <li key={item} className="about-platform-chip">{item}</li>
            ))}
          </ul>
          <p className="about-platform-text about-platform-text--emphasis">في منصة واحدة مترابطة.</p>
        </section>

        <section className="about-platform-section ui-card" aria-labelledby="about-why-heading">
          <p className="about-platform-eyebrow">القسم الثالث</p>
          <h2 id="about-why-heading" className="about-platform-heading">لماذا أُنشئت المنصة؟</h2>
          <p className="about-platform-text">تهدف المنصة إلى:</p>
          <ul className="about-platform-bullet-list">
            {WHY_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="about-platform-section" aria-labelledby="about-tech-heading">
          <p className="about-platform-eyebrow">القسم الرابع</p>
          <h2 id="about-tech-heading" className="about-platform-heading">التقنيات المستخدمة</h2>
          <div className="about-platform-card-grid about-platform-card-grid--tech">
            {TECHNOLOGIES.map(({ icon: Icon, label }) => (
              <article key={label} className="about-platform-tech-card ui-card">
                <span className="about-platform-tech-card__icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <strong>{label}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="about-platform-section about-platform-founder ui-card" aria-labelledby="about-founder-heading">
          <p className="about-platform-eyebrow">القسم الخامس</p>
          <h2 id="about-founder-heading" className="about-platform-heading">القائم على المنصة</h2>
          <p className="about-platform-text">القائم على المشروع:</p>
          <p className="about-platform-founder__name">يوسف عبدالمحسن</p>
          <p className="about-platform-founder__role">مؤسس ومطور منصة المجلس العلمي.</p>
        </section>

        <section className="about-platform-section about-platform-contact ui-card" aria-labelledby="about-contact-heading">
          <p className="about-platform-eyebrow">القسم السادس</p>
          <h2 id="about-contact-heading" className="about-platform-heading">التواصل</h2>
          <p className="about-platform-text">البريد الإلكتروني:</p>
          <div className="about-platform-contact__box">
            <span className="about-platform-contact__icon" aria-hidden="true">
              <Mail size={24} strokeWidth={1.75} />
            </span>
            <a href={`mailto:${FOUNDER_EMAIL}`} className="about-platform-contact__email" dir="ltr">
              {FOUNDER_EMAIL}
            </a>
          </div>
          <div className="about-platform-contact__actions">
            <button type="button" className="about-platform-btn about-platform-btn--primary" onClick={() => void copyEmail()}>
              <Copy size={16} aria-hidden="true" />
              {copyState === "copied" ? "تم النسخ" : copyState === "error" ? "تعذّر النسخ" : "نسخ البريد"}
            </button>
            <a href={`mailto:${FOUNDER_EMAIL}`} className="about-platform-btn about-platform-btn--secondary">
              <Mail size={16} aria-hidden="true" />
              فتح برنامج البريد
            </a>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(FOUNDER_EMAIL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="about-platform-btn about-platform-btn--ghost"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Gmail
            </a>
          </div>
        </section>

        <div className="about-platform-duo">
          <section className="about-platform-section ui-card" aria-labelledby="about-vision-heading">
            <p className="about-platform-eyebrow">القسم السابع</p>
            <h2 id="about-vision-heading" className="about-platform-heading">رؤية المنصة</h2>
            <p className="about-platform-lead about-platform-lead--compact">
              أن تصبح المجلس العلمي أكبر منصة معرفية إسلامية عربية تجمع المحتوى العلمي الموثوق في مكان واحد
              باستخدام أحدث التقنيات.
            </p>
          </section>

          <section className="about-platform-section ui-card" aria-labelledby="about-mission-heading">
            <p className="about-platform-eyebrow">القسم الثامن</p>
            <h2 id="about-mission-heading" className="about-platform-heading">الرسالة</h2>
            <p className="about-platform-lead about-platform-lead--compact">
              خدمة العلم الشرعي ونشره بطريقة احترافية، موثوقة، سهلة، ومتطورة.
            </p>
          </section>
        </div>

        <section className="about-platform-section" aria-labelledby="about-features-heading">
          <p className="about-platform-eyebrow">القسم التاسع</p>
          <h2 id="about-features-heading" className="about-platform-heading">المميزات</h2>
          <div className="about-platform-card-grid about-platform-card-grid--features">
            {FEATURES.map((feature) => (
              <article key={feature} className="about-platform-feature-card ui-card">
                <span className="about-platform-feature-card__check" aria-hidden="true">✔</span>
                <span>{feature}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="about-platform-section" aria-labelledby="about-stats-heading">
          <p className="about-platform-eyebrow">القسم العاشر</p>
          <h2 id="about-stats-heading" className="about-platform-heading">إحصائيات مباشرة</h2>
          <p className="about-platform-text">أرقام محدّثة من قاعدة بيانات المنصة.</p>
          <div className="about-platform-stats-grid" aria-live="polite">
            {stats
              ? statItems.map((item) => (
                  <article key={item.label} className="about-platform-stat-card ui-card">
                    <strong className="about-platform-stat-card__value">{formatStat(item.value)}</strong>
                    <span className="about-platform-stat-card__label">{item.label}</span>
                  </article>
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <article key={i} className="about-platform-stat-card ui-card about-platform-stat-card--loading">
                    <span className="ds-skeleton about-platform-stat-card__skeleton-value" />
                    <span className="ds-skeleton about-platform-stat-card__skeleton-label" />
                  </article>
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}
