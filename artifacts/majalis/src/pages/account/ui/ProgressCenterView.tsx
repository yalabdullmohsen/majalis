import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  buildProgressSnapshot,
  clearActivityHistory,
  clearKnowledgePlatformLocalData,
  clearLocalSearchHistory,
  isPersonalizationEnabled,
  setPersonalizationEnabled,
  type ProgressSnapshot,
} from "@/lib/knowledge-platform";
import "@/styles/pages/knowledge-platform-p0.css";

export default function ProgressCenterView() {
  const [snap, setSnap] = useState<ProgressSnapshot | null>(null);
  const [personalization, setPersonalization] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/progress",
      title: "مركز التقدّم | سُنّة",
      description: "متابعة موضع المصحف والمحفوظات والنشاط المحلي دون مبالغة أو مقارنة.",
    });
    setPersonalization(isPersonalizationEnabled());
    void buildProgressSnapshot().then(setSnap);
  }, []);

  const refresh = async () => {
    setBusy(true);
    try {
      setSnap(await buildProgressSnapshot());
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="kp-page" dir="rtl">
      <header className="kp-page__header">
        <h1 className="kp-page__title">مركز التقدّم</h1>
        <p className="kp-page__lead">
          ملخص هادئ لما وصلت إليه محليًا. لا إحصاءات غير مقاسة، ولا مقارنة مع الآخرين.
        </p>
      </header>

      <section className="kp-section" aria-labelledby="kp-mushaf">
        <h2 id="kp-mushaf" className="kp-section__title">متابعة القراءة</h2>
        {snap?.mushaf.lastPage != null ? (
          <div className="kp-continue">
            <p>
              آخر صفحة في المصحف: <strong>{snap.mushaf.lastPage}</strong>
            </p>
            {snap.mushaf.href ? (
              <Link href={snap.mushaf.href} className="kp-btn kp-btn--primary">
                متابعة القراءة
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="kp-empty">لا موضع محفوظ بعد. افتح المصحف لتبدأ المتابعة.</p>
        )}
      </section>

      <section className="kp-section" aria-labelledby="kp-bookmarks">
        <h2 id="kp-bookmarks" className="kp-section__title">المحفوظات</h2>
        {snap && snap.bookmarks.length > 0 ? (
          <ul className="kp-list">
            {snap.bookmarks.slice(0, 8).map((b) => (
              <li key={`${b.contentType}:${b.contentId}`}>
                <Link href={b.href}>{b.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="kp-empty">لا محفوظات محلية بعد.</p>
        )}
        <Link href="/vault" className="kp-link">
          فتح المخزن
        </Link>
      </section>

      <section className="kp-section" aria-labelledby="kp-activity">
        <h2 id="kp-activity" className="kp-section__title">آخر النشاط المحلي</h2>
        {snap && snap.recentActivity.length > 0 ? (
          <ul className="kp-list">
            {snap.recentActivity.slice(0, 8).map((e) => (
              <li key={e.id}>
                {e.href ? <Link href={e.href}>{e.title || e.entityId}</Link> : e.title || e.entityId}
                <span className="kp-meta"> {e.type}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="kp-empty">لا نشاط مسجّل بعد (أو التخصيص معطّل).</p>
        )}
      </section>

      {snap && snap.recentSearches.length > 0 ? (
        <section className="kp-section" aria-labelledby="kp-searches">
          <h2 id="kp-searches" className="kp-section__title">عمليات بحث محلية</h2>
          <ul className="kp-list">
            {snap.recentSearches.map((q) => (
              <li key={q}>
                <Link href={`/search?q=${encodeURIComponent(q)}`}>{q}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="kp-section" aria-labelledby="kp-privacy">
        <h2 id="kp-privacy" className="kp-section__title">الخصوصية</h2>
        <label className="kp-toggle">
          <input
            type="checkbox"
            checked={personalization}
            onChange={(e) => {
              const on = e.target.checked;
              setPersonalizationEnabled(on);
              setPersonalization(on);
            }}
          />
          <span>تفعيل التخصيص المحلي (نشاط وبحث على هذا الجهاز فقط)</span>
        </label>
        <div className="kp-actions">
          <button
            type="button"
            className="kp-btn"
            disabled={busy}
            onClick={() => {
              clearActivityHistory();
              clearLocalSearchHistory();
              void refresh();
            }}
          >
            مسح سجل النشاط والبحث
          </button>
          <button
            type="button"
            className="kp-btn kp-btn--danger"
            disabled={busy}
            onClick={() => {
              clearKnowledgePlatformLocalData();
              setPersonalization(isPersonalizationEnabled());
              void refresh();
            }}
          >
            مسح بيانات منصة المعرفة المحلية
          </button>
          <button type="button" className="kp-btn" disabled={busy} onClick={() => void refresh()}>
            تحديث
          </button>
        </div>
        <p className="kp-note">
          لا تُرسل سجلات القراءة أو البحث إلى خدمات خارجية من هذه الشاشة. Analytics منفصلة وتخضع لموافقة ملفات التعريف.
        </p>
        <Link href="/privacy-center" className="kp-link">
          مركز الخصوصية
        </Link>
      </section>
    </main>
  );
}
