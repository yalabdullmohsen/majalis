"use client";

import { Link } from "wouter";
import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { usePageView } from "@/hooks/usePageView";
import {
  PC_CATEGORIES,
  PC_ABOUT,
  PC_MEMBERS_SEED,
  PC_BASE_PATH,
  getPermanentCommitteeFatwas,
  getPermanentCommitteeHubStats,
  getTopPcTopics,
} from "@/lib/permanent-committee";
import "@/styles/permanent-committee.css";

export default function PermanentCommitteeHubPage() {
  const [search, setSearch] = useState("");
  const [latest, setLatest] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  usePageView("permanent-committee", null);

  useEffect(() => {
    const hub = getPermanentCommitteeHubStats();
    setPopular(hub.popular);
    getPermanentCommitteeFatwas({ limit: 6 })
      .then(({ data }) => setLatest(data))
      .finally(() => setLoading(false));
  }, []);

  const topics = getTopPcTopics(8);

  return (
    <div className="page-shell narrow content-hub-page permanent-committee-page">
      <PageHeader
        eyebrow="مرجع رسمي"
        title="اللجنة الدائمة للبحوث العلمية والإفتاء"
        subtitle="فتاوى وبحوث رسمية من اللجنة الدائمة — النص الأصلي محفوظ دون تعديل."
      />

      <section className="pc-about ui-card">
        <h2 className="pc-section-title">نبذة عن اللجنة</h2>
        <p className="pc-about__text">{PC_ABOUT}</p>
        <p className="pc-source-badge">المصدر: alifta.gov.sa — اللجنة الدائمة للبحوث العلمية والإفتاء</p>
      </section>

      <form
        className="pc-search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          if (search.trim()) {
            window.location.href = `${PC_BASE_PATH}/search?q=${encodeURIComponent(search.trim())}`;
          }
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في فتاوى اللجنة الدائمة..."
          aria-label="بحث في اللجنة الدائمة"
        />
        <button type="submit">بحث</button>
        <Link href={`${PC_BASE_PATH}/search`} className="pc-search-advanced">
          بحث متقدم
        </Link>
      </form>

      <section className="pc-categories">
        <h2 className="pc-section-title">التصنيفات</h2>
        <div className="content-hub-chips">
          {PC_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`${PC_BASE_PATH}/category/${encodeURIComponent(cat.name)}`}
              className="content-hub-chip"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {topics.length > 0 && (
        <section className="pc-topics">
          <h2 className="pc-section-title">أشهر الموضوعات</h2>
          <div className="pc-topic-grid">
            {topics.map((t) => (
              <Link
                key={t.name}
                href={`${PC_BASE_PATH}/category/${encodeURIComponent(t.name)}`}
                className="pc-topic-card ui-card"
              >
                <strong>{t.name}</strong>
                <span>{t.count} فتوى</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="pc-section-head">
          <h2 className="pc-section-title">أحدث الفتاوى</h2>
          <Link href={`${PC_BASE_PATH}/fatwas`}>عرض الكل</Link>
        </div>
        {loading ? (
          <Loading />
        ) : latest.length === 0 ? (
          <Empty text="لا توجد فتاوى بعد." />
        ) : (
          <div className="content-card-grid">
            {latest.map((item) => (
              <PlatformContentCard
                key={item.id}
                href={`${PC_BASE_PATH}/${item.id}`}
                title={item.title || item.question}
                summary={item.summary || item.answer?.slice(0, 120)}
                meta={[item.category, item.fatwa_number ? `#${item.fatwa_number}` : null].filter(Boolean).join(" · ")}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="pc-section-head">
          <h2 className="pc-section-title">الأكثر قراءة</h2>
        </div>
        <div className="content-card-grid">
          {popular.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`${PC_BASE_PATH}/${item.id}`}
              title={item.title || item.question}
              summary={item.summary}
              meta={`${item.view_count ?? 0} قراءة · ${item.category}`}
            />
          ))}
        </div>
      </section>

      <section className="pc-members ui-card">
        <h2 className="pc-section-title">أعضاء اللجنة</h2>
        <ul className="pc-members__list">
          {PC_MEMBERS_SEED.map((m) => (
            <li key={m.name}>
              <strong>{m.name}</strong>
              <span>{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="pc-research-link ui-card">
        <h2 className="pc-section-title">البحوث العلمية</h2>
        <p>تصفّح الأبحاث العلمية الرسمية في قسم الأبحاث.</p>
        <Link href="/research" className="page-action-btn">
          الأبحاث العلمية
        </Link>
      </section>
    </div>
  );
}
