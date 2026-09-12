import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  getHadithById,
  parseHadithId,
  type HadithRecord,
} from "@/lib/hadith-corpus";
import { HadithGradeBadge } from "@/components/hadith/HadithGradeBadge";
import { HadithSourceBlock } from "@/components/hadith/HadithSourceBlock";
import "@/styles/pages/hadith-design-language.css";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { ReaderScreen } from "@/components/design-system/screens";
import { KnowledgeLayout } from "@/components/knowledge";
import "@/styles/pages/hadith.css";

function ShareBlock({ hadith }: { hadith: HadithRecord }) {
  const warning = hadith.isMawdu
    ? `${hadith.mawduWarning || "حديث موضوع لا يصحّ"} — `
    : "";
  const text = `${warning}${hadith.matn}\n— ${hadith.id}${hadith.grade ? ` · ${hadith.grade.quote}` : ""}`;
  return (
    <button
      type="button"
      className="hadith-id-copy"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
      }}
    >
      نسخ للمشاركة
    </button>
  );
}

function HadithDetailSkeleton() {
  return (
    <div className="page-shell hadith-by-id" dir="rtl" aria-busy="true" aria-label="تحديث الحديث">
      <div className="hadith-detail-card hadith-detail-card--matn hadith-detail-skeleton" />
      <div className="hadith-detail-card hadith-detail-skeleton hadith-detail-skeleton--short" />
      <div className="hadith-detail-card hadith-detail-skeleton hadith-detail-skeleton--tall" />
    </div>
  );
}

export default function HadithByIdView() {
  const params = useParams<{ id?: string }>();
  const raw = params.id ?? "";
  const [hadith, setHadith] = useState<HadithRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getHadithById(raw).then((h) => {
      if (cancelled) return;
      setHadith(h);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [raw]);

  useEffect(() => {
    if (!hadith) return;
    applyPageSeo({
      path: `/hadith/${hadith.id}`,
      title: `${hadith.id} | الحديث | سُنّة`,
      description: hadith.isMawdu
        ? `تحذير: حديث موضوع — ${hadith.matn.slice(0, 120)}`
        : hadith.matn.slice(0, 160),
      keywords: ["حديث", hadith.id, hadith.book],
    });
  }, [hadith]);

  if (!parseHadithId(raw)) {
    return (
      <div className="page-shell hadith-by-id" dir="rtl">
        <div className="hadith-detail-card hadith-detail-card--notice">
          <p>معرّف غير صالح. الصيغة: <code>bukhari:1</code></p>
          <Link href="/hadith/sahih" className="hadith-detail-link">تصفّح الأحاديث الصحيحة</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <HadithDetailSkeleton />;
  }

  if (!hadith) {
    return (
      <div className="page-shell hadith-by-id" dir="rtl">
        <div className="hadith-detail-card hadith-detail-card--notice">
          <p>لم يُعثر على الحديث في المصادر المحمّلة بعد.</p>
          <Link href="/hadith/sahih" className="hadith-detail-link">تصفّح الأحاديث الصحيحة</Link>
        </div>
      </div>
    );
  }

  return (
    <ReaderScreen compose="mark">
    <KnowledgeLayout kind="hadith" className={`page-shell hadith-by-id${hadith.isMawdu ? " hadith-by-id--mawdu" : ""}`} data-kx="1">
    <article dir="rtl">
      {hadith.isMawdu ? (
        <div className="hadith-mawdu-banner" role="alert">
          <strong>{hadith.mawduWarning || "حديث موضوع لا يصحّ"}</strong>
          {hadith.grade ? (
            <p>
              {hadith.grade.quote} — {hadith.grade.source}
            </p>
          ) : null}
        </div>
      ) : null}

      <header className="hadith-detail-card hadith-detail-card--head" data-kx-kind="summary">
        <p className="hadith-detail-card__eyebrow">{hadith.numberingSystem}</p>
        <h1 className="hadith-by-id__id">
          <button
            type="button"
            className="hadith-id-chip"
            title="نسخ المعرّف"
            onClick={() => {
              void navigator.clipboard?.writeText(hadith.id).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {hadith.id}
          </button>
          {copied ? <span className="hadith-id-copied">تم النسخ</span> : null}
        </h1>
        {hadith.chapter ? (
          <p className="hadith-by-id__meta">{hadith.chapter}</p>
        ) : null}
      </header>

      <section className="hadith-detail-card hadith-detail-card--matn" aria-label="متن الحديث" data-kx-kind="definition">
        <h2 className="hadith-detail-card__title">المتن</h2>
        <blockquote className="hadith-detail-matn hdl-role--matn">{hadith.matn}</blockquote>
      </section>

      <HadithSourceBlock
        narrator={hadith.narrator}
        source={hadith.numberingSystem}
        takhrij={hadith.takhrij}
        grade={hadith.grade?.quote || hadith.grade?.verdict || null}
      />
      {hadith.grade ? (
        <section className="hadith-detail-card hdl-role--sharh" aria-label="تفصيل الحكم" data-kx-kind="ruling">
          <h2 className="hadith-detail-card__title">تفصيل الحكم</h2>
          <div className="hadith-detail-grade">
            <HadithGradeBadge grade={hadith.grade.quote || hadith.grade.verdict || null} />
            <p className="hadith-detail-grade__quote">{hadith.grade.quote}</p>
            <p className="hadith-by-id__grade-src">المصدر: {hadith.grade.source}</p>
          </div>
        </section>
      ) : null}

      <div className="hadith-detail-card hadith-detail-card--actions">
        <ShareBlock hadith={hadith} />
      </div>

      <ExploreAlsoNav
        title="اقرأ أيضاً"
        links={[
          { href: "/hadith/sahih", label: "الأحاديث الصحيحة" },
          { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
          { href: "/hadith-science", label: "مصطلح الحديث" },
        ]}
      />
    </article>
    </KnowledgeLayout>
    </ReaderScreen>
  );
}
