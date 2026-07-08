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
    title: "المصحف الرقمي الاحترافي",
    description: "604 صفحة بصور CDN عالية الجودة، انتقال سلس، وضع ليلي، فهرس شامل للسور والأجزاء والأحزاب، bookmark.",
    progress: 95,
    status: "beta",
  },
  {
    title: "قاعدة بيانات المكتبة",
    description: "100 كتاب في التفسير والحديث والفقه والعقيدة والأصول واللغة والبلاغة والتاريخ، مع بحث وتصفية.",
    progress: 93,
    status: "beta",
  },
  {
    title: "المنظومة الأمنية لـ Supabase",
    description: "SECURITY INVOKER للـ views، RLS على جميع الجداول، policies متكاملة، حماية البيانات الحساسة.",
    progress: 92,
    status: "beta",
  },
  {
    title: "قسم العلماء والمشايخ",
    description: "65+ شيخاً من الكويت والخليج والعالم العربي والتاريخ الإسلامي، مع بيانات كاملة وتراجم موثقة.",
    progress: 90,
    status: "beta",
  },
  {
    title: "قسم الفتاوى والأحكام",
    description: "70+ فتوى موثقة، 39 حكماً شرعياً، 30+ مسألة فقهية معاصرة، مع أدلة ومراجع وجلسات المجمع الفقهي.",
    progress: 88,
    status: "beta",
  },
  {
    title: "الأذان والمؤذنون",
    description: "مكتبة الأذان بأصوات المؤذنين، تقييمات، مفضلة، وإعدادات التنبيه.",
    progress: 60,
    status: "in-progress",
  },
  {
    title: "التوصيات الذكية المخصّصة",
    description: "توصيات دقيقة مبنية على اهتماماتك وسجل قراءتك والعلاقات المعرفية.",
    progress: 55,
    status: "in-progress",
  },
  {
    title: "الوضع دون اتصال (PWA)",
    description: "تثبيت التطبيق على الجهاز وتصفح الأذكار والقرآن دون إنترنت.",
    progress: 70,
    status: "beta",
  },
  {
    title: "بحث متقدم في القرآن",
    description: "البحث بنص الآية أو رقم السورة أو الجزء أو رقم الصفحة مع عرض النتائج.",
    progress: 45,
    status: "in-progress",
  },
  {
    title: "الشهادات العلمية الرقمية",
    description: "شهادات قابلة للتحقق بعد إكمال المسارات التعليمية والدورات.",
    progress: 30,
    status: "planned",
  },
  {
    title: "تطبيق الجوال المحلي",
    description: "تطبيق iOS/Android بأداء أفضل وميزات خاصة بالهاتف.",
    progress: 20,
    status: "planned",
  },
  {
    title: "مسابقة الاختبار الإسلامي",
    description: "645+ سؤال في السيرة والفقه والعقيدة والقرآن والتاريخ والرقائق، بمستويات متعددة وإحصائيات أداء.",
    progress: 90,
    status: "beta",
  },
  {
    title: "موسوعة الأحكام الشرعية",
    description: "39 حكماً شرعياً موثقاً مع الأدلة والمراجع في الطهارة والصلاة والزكاة والمعاملات والأسرة والميراث.",
    progress: 85,
    status: "beta",
  },
  {
    title: "الدورات العلمية السنوية",
    description: "39+ دورة علمية في التفسير والحديث والعقيدة والفقه والنحو، مع جداول ومتون وروابط تسجيل.",
    progress: 80,
    status: "beta",
  },
  {
    title: "نظام الإشعارات الذكي",
    description: "إشعارات بمواقيت الصلاة والأذكار والدروس والمستجدات مع دعم PWA لجميع الأجهزة.",
    progress: 65,
    status: "in-progress",
  },
  {
    title: "خرائط المساجد والحلقات",
    description: "خريطة تفاعلية لمواقع الدروس والمساجد في الكويت مع معلومات المواعيد والأئمة.",
    progress: 35,
    status: "planned",
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
