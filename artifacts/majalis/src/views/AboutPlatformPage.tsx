"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Mail, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { usePageSeo } from "@/lib/seo";
import { fetchAboutPlatformStats, type AboutPlatformStats } from "@/lib/platform-about-stats";
import "@/styles/about-platform.css";

const FOUNDER_EMAIL = "yalabdullmohsen1@gmail.com";

const BENEFICIARIES = [
  "طلبة العلم الشرعي",
  "الدعاة والخطباء",
  "العائلات المسلمة",
  "المعلمون والمدرسون",
  "الباحثون عن محتوى موثوق",
  "عامة المسلمين",
];

const WHY_WE_NEED = [
  {
    title: "حفظ المعرفة الإسلامية",
    text: "أرشفة الدروس والفتاوى والمتون في مكان واحد يحفظها من الضياع ويسهّل الرجوع إليها.",
  },
  {
    title: "سهولة الوصول",
    text: "بحث موحّد وواجهة عربية RTL تصل بك إلى المحتوى الموثوق دون تشتت بين مصادر متفرقة.",
  },
  {
    title: "الأتمتة الذكية",
    text: "محركات معرفية واستيراد آلي يقلّلان الجهد اليدوي ويُسرّعان نشر المحتوى الشرعي الموثّق.",
  },
  {
    title: "مصادر موثوقة",
    text: "الاعتماد على علماء معتمدين ومراجع شرعية مع نظام جودة ومراجعة قبل النشر.",
  },
  {
    title: "تجربة تعليمية حديثة",
    text: "مسارات تعلم، ألعاب تعليمية، ومحتوى يومي في تجربة سريعة تعمل على الجوال والحاسوب.",
  },
];

function formatStat(value: number) {
  return value.toLocaleString("ar-EG");
}

export default function AboutPlatformPage() {
  const [stats, setStats] = useState<AboutPlatformStats | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  usePageSeo("/about-platform");

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
        { label: "حلقات القرآن", value: stats.quranCirclesCount },
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
          <p className="about-platform-eyebrow">نبذة عن المنصة</p>
          <h2 id="about-intro-heading" className="about-platform-heading">
            ما هو المجلس العلمي؟
          </h2>
          <p className="about-platform-lead">
            المجلس العلمي (Majlis Ilm) منصة علمية إسلامية عربية متخصصة تجمع الدروس الشرعية، والفتاوى،
            والقرآن، والأذكار، والمكتبة، والألعاب التعليمية في مكان واحد — مع توظيف الذكاء الاصطناعي
            ومحركات المعرفة لخدمة العلم الشرعي بطريقة احترافية وموثوقة.
          </p>
          <div className="about-platform-subgrid">
            <div className="about-platform-subblock">
              <h3>لماذا أُنشئت؟</h3>
              <p>
                لمعالجة تشتت المحتوى الإسلامي على الإنترنت، وتقديم مرجع موحّد يسهّل الوصول إلى العلم
                الموثوق للكويت والعالم العربي.
              </p>
            </div>
            <div className="about-platform-subblock">
              <h3>من يستفيد؟</h3>
              <ul className="about-platform-chip-list">
                {BENEFICIARIES.map((item) => (
                  <li key={item} className="about-platform-chip">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="about-platform-duo">
          <section className="about-platform-section ui-card" aria-labelledby="about-mission-heading">
            <p className="about-platform-eyebrow">
              <Target size={14} aria-hidden="true" /> الرسالة
            </p>
            <h2 id="about-mission-heading" className="about-platform-heading">
              رسالتنا
            </h2>
            <p className="about-platform-lead about-platform-lead--compact">
              خدمة العلم الشرعي ونشره بطريقة احترافية، موثوقة، سهلة، ومتطورة — مع الحفاظ على أمانة
              العلم ومراجعه.
            </p>
          </section>

          <section className="about-platform-section ui-card" aria-labelledby="about-vision-heading">
            <p className="about-platform-eyebrow">
              <Users size={14} aria-hidden="true" /> الرؤية
            </p>
            <h2 id="about-vision-heading" className="about-platform-heading">
              رؤيتنا
            </h2>
            <p className="about-platform-lead about-platform-lead--compact">
              أن تصبح المجلس العلمي مرجعاً معرفياً إسلامياً عربياً رائداً يجمع المحتوى العلمي الموثوق
              في مكان واحد باستخدام أحدث التقنيات.
            </p>
          </section>
        </div>

        <section className="about-platform-section ui-card" aria-labelledby="about-goal-heading">
          <p className="about-platform-eyebrow">الهدف بعيد المدى</p>
          <h2 id="about-goal-heading" className="about-platform-heading">
            الهدف طويل الأمد
          </h2>
          <p className="about-platform-text">
            بناء منصة معرفية متكاملة تنمو تلقائياً كل يوم — دروس، فوائد، أسئلة، متون، ومحتوى قرآني —
            دون الاعتماد على استيراد يدوي، مع الحفاظ على أعلى معايير الجودة والتوثيق الشرعي.
          </p>
        </section>

        <section className="about-platform-section ui-card" aria-labelledby="about-why-heading">
          <p className="about-platform-eyebrow">لماذا نحتاج المنصة؟</p>
          <h2 id="about-why-heading" className="about-platform-heading">
            لماذا نحتاج المنصة؟
          </h2>
          <div className="about-platform-subgrid">
            {WHY_WE_NEED.map((item) => (
              <div key={item.title} className="about-platform-subblock">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-platform-section about-platform-founder ui-card" aria-labelledby="about-founder-heading">
          <p className="about-platform-eyebrow">القائم على المنصة</p>
          <h2 id="about-founder-heading" className="about-platform-heading">
            القائم على المنصة
          </h2>
          <p className="about-platform-text">مؤسس ومطور منصة المجلس العلمي:</p>
          <p className="about-platform-founder__name">يوسف عبدالمحسن</p>
          <p className="about-platform-founder__role">
            يقود رؤية المنصة وتطويرها التقني لخدمة العلم الشرعي والمجتمع المسلم.
          </p>
        </section>

        <section className="about-platform-section about-platform-contact ui-card" aria-labelledby="about-contact-heading">
          <p className="about-platform-eyebrow">تواصل معنا</p>
          <h2 id="about-contact-heading" className="about-platform-heading">
            تواصل معنا
          </h2>
          <p className="about-platform-text">للاستفسارات، الاقتراحات، والتعاون — راسلنا عبر البريد:</p>
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

        <section className="about-platform-section" aria-labelledby="about-stats-heading">
          <p className="about-platform-eyebrow">إحصائيات المنصة</p>
          <h2 id="about-stats-heading" className="about-platform-heading">
            أرقام مباشرة
          </h2>
          <p className="about-platform-text">محتوى المنصة من قاعدة البيانات والمصادر الموثقة.</p>
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
