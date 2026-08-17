import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  getHadithById,
  parseHadithId,
  type HadithRecord,
} from "@/lib/hadith-corpus";
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
      title: `${hadith.id} | الحديث | المجلس العلمي`,
      description: hadith.isMawdu
        ? `تحذير: حديث موضوع — ${hadith.matn.slice(0, 120)}`
        : hadith.matn.slice(0, 160),
      keywords: ["حديث", hadith.id, hadith.book],
    });
  }, [hadith]);

  if (!parseHadithId(raw)) {
    return (
      <div className="page-shell hadith-by-id" dir="rtl">
        <p>معرّف غير صالح. الصيغة: <code>bukhari:1</code></p>
        <Link href="/hadith">← العودة للحديث</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell hadith-by-id" dir="rtl" aria-busy="true">
        <p>جاري تحميل الحديث…</p>
      </div>
    );
  }

  if (!hadith) {
    return (
      <div className="page-shell hadith-by-id" dir="rtl">
        <p>لم يُعثر على الحديث في المصادر المحمّلة بعد.</p>
        <Link href="/hadith">← العودة للحديث</Link>
      </div>
    );
  }

  return (
    <article className={`page-shell hadith-by-id${hadith.isMawdu ? " hadith-by-id--mawdu" : ""}`} dir="rtl">
      <nav className="hadith-by-id__nav">
        <Link href="/hadith">الحديث</Link>
        <span aria-hidden="true"> · </span>
        <span>{hadith.id}</span>
      </nav>

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

      <header className="hadith-by-id__head">
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
        <p className="hadith-by-id__meta">
          {hadith.numberingSystem}
          {hadith.chapter ? ` · ${hadith.chapter}` : ""}
          {hadith.narrator ? ` · الراوي: ${hadith.narrator}` : ""}
        </p>
      </header>

      <div className="hadith-by-id__matn">
        <p>{hadith.matn}</p>
      </div>

      <section className="hadith-by-id__grade" aria-label="الحكم">
        {hadith.grade ? (
          <p>
            <strong>الحكم المنقول:</strong> {hadith.grade.quote}
            <br />
            <span className="hadith-by-id__grade-src">المصدر: {hadith.grade.source}</span>
          </p>
        ) : (
          <p className="hadith-by-id__ungraded">لم يُوثَّق حكمه في مصادرنا بعد</p>
        )}
        {hadith.takhrij ? <p>التخريج: {hadith.takhrij}</p> : null}
      </section>

      <ShareBlock hadith={hadith} />
    </article>
  );
}
