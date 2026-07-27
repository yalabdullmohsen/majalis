import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  ASSISTANT_POLICY_LINES,
  ANTI_CHEATING_NOTICE,
  RESEARCH_CATEGORIES,
  categoryLabel,
  suggestResearchTopics,
  listCrowdedTopics,
  listResearchGaps,
  suggestKeywordsFromText,
  draftProposalOutline,
} from "@/lib/researches";
import "@/styles/pages/researches.css";

export default function ResearchAssistantPage() {
  const [interest, setInterest] = useState("");
  const [draftTopic, setDraftTopic] = useState("");
  const [catId, setCatId] = useState("fiqh");
  const [kwSource, setKwSource] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research/assistant",
      title: "مساعدة الباحث | الأبحاث الشرعية",
      description: "أدوات مساعدة للبحث الشرعي دون كتابة البحث نيابةً عن الطالب.",
      robots: "noindex,follow",
    });
  }, []);

  const topics = useMemo(() => suggestResearchTopics(interest, 8), [interest]);
  const crowded = useMemo(() => listCrowdedTopics(), []);
  const gaps = useMemo(() => listResearchGaps(), []);
  const keywords = useMemo(() => suggestKeywordsFromText(kwSource), [kwSource]);
  const outline = useMemo(
    () => draftProposalOutline(draftTopic || interest, categoryLabel(catId)),
    [draftTopic, interest, catId],
  );

  return (
    <div className="sr-page">
      <p><Link href="/academic-research" className="sr-section__link">← الأبحاث الشرعية</Link></p>
      <h1 className="sr-detail__h1">مساعدة الباحث</h1>
      <div className="sr-notice" role="note">
        {ASSISTANT_POLICY_LINES.map((line) => (
          <p key={line} style={{ margin: "0.25rem 0" }}>{line}</p>
        ))}
      </div>

      <section className="sr-section">
        <h2 className="sr-section__title">اقتراح موضوعات</h2>
        <label className="sr-form">
          مجال اهتمامك
          <input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="مثال: مقاصد، نوازل، حديث…" />
        </label>
        <div className="sr-list" style={{ marginTop: "0.75rem" }}>
          {topics.map((t) => (
            <div key={t.title} className="sr-card">
              <h3 className="sr-card__title">{t.title}</h3>
              <p className="sr-card__meta">
                <span className="sr-badge">{categoryLabel(t.categoryId)}</span>
                {t.crowded && <span className="sr-badge">موضوع مبحوث بكثرة نسبيًا</span>}
              </p>
              <p className="sr-card__abs">{t.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sr-section">
        <h2 className="sr-section__title">موضوعات سبق بحثها بكثرة (في الفهرس المحلي)</h2>
        {crowded.length === 0 ? (
          <p className="sr-empty">لا بيانات كافية بعد.</p>
        ) : (
          <ul className="sr-prose">
            {crowded.map((c) => (
              <li key={c.categoryId}>{c.label}: {c.count}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="sr-section">
        <h2 className="sr-section__title">فجوات بحثية محتملة (محليًا فقط)</h2>
        <div className="sr-cat-grid">
          {gaps.map((g) => (
            <div key={g.categoryId} className="sr-cat">
              {g.label}
              <div style={{ fontWeight: 400, fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {g.publishedCount} منشور — {g.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sr-section">
        <h2 className="sr-section__title">اقتراح كلمات مفتاحية</h2>
        <textarea
          className="sr-search"
          style={{ width: "100%", minHeight: "5rem" }}
          value={kwSource}
          onChange={(e) => setKwSource(e.target.value)}
          placeholder="الصق مسودة فكرة أو ملخصًا قصيرًا…"
        />
        <p className="sr-card__meta" style={{ marginTop: "0.5rem" }}>
          {keywords.map((k) => <span key={k} className="sr-badge">{k}</span>)}
        </p>
      </section>

      <section className="sr-section">
        <h2 className="sr-section__title">تصور أولي لخطة البحث</h2>
        <div className="sr-filters">
          <input
            value={draftTopic}
            onChange={(e) => setDraftTopic(e.target.value)}
            placeholder="عنوان مقترح"
            style={{ flex: 1, minHeight: 40, padding: "0.4rem 0.6rem" }}
          />
          <select value={catId} onChange={(e) => setCatId(e.target.value)} aria-label="تصنيف">
            {RESEARCH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <pre className="sr-cite-box">{outline}</pre>
        <p className="sr-notice">{ANTI_CHEATING_NOTICE}</p>
      </section>
    </div>
  );
}
