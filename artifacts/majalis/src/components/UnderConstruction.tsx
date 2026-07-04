"use client";

import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Circle, Loader2, Wrench } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

export type WipFeature = {
  label: string;
  /** حالة الميزة: مكتملة / قيد التطوير / قادمة */
  status?: "done" | "in-progress" | "planned";
};

export type UnderConstructionProps = {
  /** العنوان الرئيسي — الافتراضي "جاري التعديل" */
  title?: string;
  /** وصف موجز لما يجري العمل عليه */
  description?: string;
  /** نسبة الإنجاز 0–100 — تُظهر شريط التقدّم عند تمريرها */
  progress?: number;
  /** قائمة المميزات قيد التطوير */
  features?: WipFeature[];
  /** رابط زر العودة ونصّه */
  backHref?: string;
  backLabel?: string;
  /** مسار الصفحة لضبط SEO (يُضبط noindex تلقائياً) */
  seoPath?: string;
};

const STATUS_META: Record<NonNullable<WipFeature["status"]>, { label: string; cls: string; Icon: typeof Circle }> = {
  done: { label: "مكتملة", cls: "uc-feat--done", Icon: CheckCircle2 },
  "in-progress": { label: "قيد التطوير", cls: "uc-feat--progress", Icon: Loader2 },
  planned: { label: "قادمة", cls: "uc-feat--planned", Icon: Circle },
};

export function UnderConstruction({
  title = "جاري التعديل",
  description = "نعمل على تطوير هذه الميزة لتقديمها لك بأعلى جودة. تفقّدها قريباً بإذن الله.",
  progress,
  features,
  backHref = "/",
  backLabel = "العودة للرئيسية",
  seoPath = "/under-construction",
}: UnderConstructionProps) {
  const pct = typeof progress === "number" ? Math.max(0, Math.min(100, Math.round(progress))) : undefined;

  useEffect(() => {
    // صفحة تطويرية — تُستبعد من الفهرسة حفاظاً على SEO
    applyPageSeo({
      path: seoPath,
      title: `${title} | المجلس العلمي`,
      description,
      robots: "noindex, follow",
    });
  }, [title, description, seoPath]);

  return (
    <div className="uc-page" role="main">
      <div className="uc-card">
        <div className="uc-badge" aria-hidden="true">
          <Wrench size={30} strokeWidth={1.9} />
        </div>

        <h1 className="uc-title">{title}</h1>
        <p className="uc-desc">{description}</p>

        {pct !== undefined && (
          <div className="uc-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="نسبة الإنجاز">
            <div className="uc-progress__head">
              <span>نسبة الإنجاز</span>
              <span className="uc-progress__pct">{pct.toLocaleString("ar-EG")}٪</span>
            </div>
            <div className="uc-progress__track">
              <div className="uc-progress__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {features && features.length > 0 && (
          <div className="uc-features">
            <p className="uc-features__title">ما نعمل عليه</p>
            <ul className="uc-features__list">
              {features.map((f, i) => {
                const meta = STATUS_META[f.status ?? "in-progress"];
                const Icon = meta.Icon;
                return (
                  <li key={`${f.label}-${i}`} className={`uc-feat ${meta.cls}`}>
                    <Icon size={17} strokeWidth={2} aria-hidden="true" className="uc-feat__icon" />
                    <span className="uc-feat__label">{f.label}</span>
                    <span className="uc-feat__status">{meta.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Link href={backHref} className="uc-back">
          <ArrowRight size={18} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </div>
  );
}

export default UnderConstruction;
