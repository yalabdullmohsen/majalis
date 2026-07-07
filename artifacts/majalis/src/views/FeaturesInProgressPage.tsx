"use client";

import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Rocket } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

type FeatureStatus = "in-progress" | "planned" | "beta";

type RoadmapFeature = {
  title: string;
  description: string;
  progress: number; // 0..100
  status: FeatureStatus;
};

const STATUS_LABEL: Record<FeatureStatus, string> = {
  "in-progress": "قيد التطوير",
  beta: "تجريبي",
  planned: "قادم",
};

// خارطة الطريق — يعدّلها المشرف حسب ما يجري تطويره فعلياً.
const FEATURES: RoadmapFeature[] = [
  {
    title: "توسعة قسم القرآن الكريم",
    description: "تلاوات متعددة، تفاسير موثّقة، وبحث متقدّم داخل المصحف.",
    progress: 65,
    status: "in-progress",
  },
  {
    title: "تصنيف الأحاديث (صحيحة / ضعيفة / موضوعة)",
    description: "فصل الأحاديث في ثلاث قوائم مستقلة مع منع أي اختلاط بينها.",
    progress: 40,
    status: "in-progress",
  },
  {
    title: "التوصيات الذكية المخصّصة",
    description: "توصيات دقيقة مبنية على اهتماماتك وسجل قراءتك والعلاقات المعرفية.",
    progress: 55,
    status: "beta",
  },
  {
    title: "التقويم الهجري والتحويل",
    description: "عرض المناسبات بالأشهر الهجرية مع مؤشر الأشهر الحُرُم ودعم التحويل الميلادي.",
    progress: 70,
    status: "in-progress",
  },
  {
    title: "الوضع دون اتصال (تطبيق قابل للتثبيت)",
    description: "تصفّح الدروس والأذكار والقرآن دون إنترنت مع تثبيت التطبيق على جهازك.",
    progress: 80,
    status: "beta",
  },
];

export default function FeaturesInProgressPage() {
  useEffect(() => {
    // صفحة تطويرية — noindex حفاظاً على SEO
    applyPageSeo({
      path: "/features-in-progress",
      title: "مميزات قيد التطوير | المجلس العلمي",
      description: "المميزات الجديدة التي نعمل على تطويرها في المجلس العلمي ونسب إنجازها.",
      robots: "noindex, follow",
    });
  }, []);

  const overall = Math.round(FEATURES.reduce((s, f) => s + f.progress, 0) / FEATURES.length);

  return (
    <div className="fip-page" role="main">
      <header className="fip-head">
        <div className="uc-badge" aria-hidden="true">
          <Rocket size={28} strokeWidth={1.9} />
        </div>
        <h1 className="uc-title">مميزات قيد التطوير</h1>
        <p className="uc-desc">
          نعمل باستمرار على تطوير المجلس العلمي. هذه لمحة عن أبرز المميزات القادمة ونسبة إنجاز كلٍّ منها.
        </p>
        <div className="fip-overall">
          <span>متوسط الإنجاز العام</span>
          <strong>{overall.toLocaleString("ar-EG")}٪</strong>
        </div>
      </header>

      <div className="fip-grid">
        {FEATURES.map((f) => {
          const pct = Math.max(0, Math.min(100, Math.round(f.progress)));
          return (
            <article key={f.title} className="fip-card">
              <div className="fip-card__top">
                <h2 className="fip-card__title">{f.title}</h2>
                <span className={`fip-status fip-status--${f.status}`}>{STATUS_LABEL[f.status]}</span>
              </div>
              <p className="fip-card__desc">{f.description}</p>
              <div
                className="uc-progress fip-progress"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`نسبة إنجاز ${f.title}`}
              >
                <div className="uc-progress__head">
                  <span>نسبة الإنجاز</span>
                  <span className="uc-progress__pct">{pct.toLocaleString("ar-EG")}٪</span>
                </div>
                <div className="uc-progress__track">
                  <div className="uc-progress__fill fip-prog-fill" style={{ "--fip-pct": `${pct}%` } as React.CSSProperties} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fip-back-wrap">
        <Link href="/" className="uc-back">
          <ArrowRight size={18} aria-hidden="true" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
