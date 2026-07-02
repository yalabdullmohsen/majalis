"use client";

import { useEffect, useRef } from "react";
import { KUWAIT_SHEIKHS } from "@/lib/kuwait-sheikhs";

declare global {
  interface Window { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } }
}

function useTwitterEmbed(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        if (window.twttr?.widgets) {
          window.twttr.widgets.load(el);
          return;
        }
        if (document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) return;
        const s = document.createElement("script");
        s.src = "https://platform.twitter.com/widgets.js";
        s.async = true;
        s.charset = "utf-8";
        document.body.appendChild(s);
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}


function SheikhCard({ sheikh }: { sheikh: (typeof KUWAIT_SHEIKHS)[number] }) {
  return (
    <a
      href={sheikh.drosq8Url}
      target="_blank"
      rel="noopener noreferrer"
      className="sheikh-card"
      aria-label={`دروس ${sheikh.name} على موقع دروس الكويت`}
    >
      <div className="sheikh-card__avatar-wrap">
        {sheikh.twitterHandle ? (
          <>
            <img
              src={`https://unavatar.io/twitter/${sheikh.twitterHandle}?fallback=false`}
              alt={sheikh.name}
              className="sheikh-avatar sheikh-avatar--photo"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const sib = el.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = "flex";
              }}
              loading="lazy"
            />
            <span
              className="sheikh-avatar sheikh-avatar--initials"
              style={{
                display: "none",
                background: ["#1b5e3b","#7c5e1b","#1b3a5e","#5e1b1b","#3b1b5e","#1b5e56"][
                  sheikh.name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 6
                ],
              }}
              aria-hidden="true"
            >
              {sheikh.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("")}
            </span>
          </>
        ) : (
          <span
            className="sheikh-avatar sheikh-avatar--initials"
            style={{
              background: ["#1b5e3b","#7c5e1b","#1b3a5e","#5e1b1b","#3b1b5e","#1b5e56"][
                sheikh.name.split("").reduce((a,c)=>a+c.charCodeAt(0),0) % 6
              ],
            }}
            aria-hidden="true"
          >
            {sheikh.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("")}
          </span>
        )}
      </div>
      <div className="sheikh-card__body">
        <h3 className="sheikh-card__name">{sheikh.name}</h3>
        <p className="sheikh-card__specialty">{sheikh.specialty}</p>
        <span className="sheikh-card__link">عرض الدروس ←</span>
      </div>
    </a>
  );
}

export default function KuwaitLessonsPage() {
  const feedRef = useRef<HTMLDivElement>(null);
  useTwitterEmbed(feedRef);

  return (
    <div className="page-shell narrow" dir="rtl">
      {/* Header */}
      <div className="kuwait-lessons-header">
        <div>
          <p className="kuwait-lessons-eyebrow">الكويت</p>
          <h1 className="kuwait-lessons-title">دروس المشايخ القادمة</h1>
          <p className="kuwait-lessons-subtitle">
            جميع الدروس العلمية القادمة لمشايخ الكويت — محدَّثة تلقائياً عبر موقع{" "}
            <a href="https://drosq8.com" target="_blank" rel="noopener noreferrer" className="kuwait-lessons-source-link">
              دروس الكويت
            </a>
          </p>
        </div>
        <span className="kuwait-lessons-live-badge">● تحديث تلقائي</span>
      </div>

      {/* Twitter feed — @drosq8 */}
      <section className="kuwait-lessons-feed-section">
        <h2 className="kuwait-lessons-section-title">آخر إعلانات الدروس</h2>
        <p className="kuwait-lessons-feed-note">
          المصدر:{" "}
          <a href="https://twitter.com/drosq8" target="_blank" rel="noopener noreferrer">@drosq8</a>
          {" "}— حساب موقع دروس الكويت الرسمي
        </p>
        <div ref={feedRef} className="kuwait-lessons-feed-wrap">
          <a
            className="twitter-timeline"
            data-lang="ar"
            data-theme="light"
            data-height="600"
            data-chrome="noheader nofooter noborders"
            href="https://twitter.com/drosq8"
          >
            جارٍ تحميل إعلانات الدروس…
          </a>
        </div>
        <p className="kuwait-lessons-attribution">
          المحتوى من حساب @drosq8 الرسمي •{" "}
          <a href="https://twitter.com/drosq8" target="_blank" rel="noopener noreferrer">
            تصفح الحساب مباشرة
          </a>
        </p>
      </section>

      {/* Sheikh grid */}
      <section className="kuwait-lessons-sheikhs-section">
        <h2 className="kuwait-lessons-section-title">مشايخ الكويت</h2>
        <p className="kuwait-lessons-feed-note">
          اضغط على أي شيخ للاطلاع على دروسه الكاملة في موقع دروس الكويت
        </p>
        <div className="sheikh-grid">
          {KUWAIT_SHEIKHS.map((sheikh) => (
            <SheikhCard key={sheikh.id} sheikh={sheikh} />
          ))}
        </div>
      </section>

      {/* Source note */}
      <div className="kuwait-lessons-footer-note">
        <strong>المصدر:</strong>{" "}
        <a href="https://drosq8.com" target="_blank" rel="noopener noreferrer">drosq8.com</a>
        {" "}— موقع دروس الكويت. هذه الصفحة تعرض البيانات مباشرة من المصدر الرسمي دون تخزينها.
      </div>
    </div>
  );
}
