import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import type { FiqhGuideSection } from "@/lib/fiqh-guides/types";
import "@/styles/pages/fiqh-guide.css";

type Props = { section: FiqhGuideSection };

export function FiqhGuidePage({ section }: Props) {
  const [tabId, setTabId] = useState(section.tabs[0]?.id ?? "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: section.path,
      title: `${section.seoTitle} | المجلس العلمي`,
      description: section.seoDescription,
      keywords: section.keywords,
    });
  }, [section]);

  const activeTab = section.tabs.find((t) => t.id === tabId) ?? section.tabs[0];

  const filteredCards = useMemo(() => {
    if (!activeTab) return [];
    const q = search.trim();
    if (!q) return activeTab.cards;
    return activeTab.cards.filter((c) =>
      arabicMatchAny(
        [c.title, c.summary, ...(c.points ?? []), c.evidence ?? "", c.note ?? ""],
        q,
      ),
    );
  }, [activeTab, search]);

  return (
    <div className="fg-page" dir="rtl">
      <header className="fg-hero">
        <span className="fg-hero__badge">{section.badge}</span>
        <h1 className="fg-hero__title">{section.title}</h1>
        <p className="fg-hero__sub">{section.subtitle}</p>
        <ShareButtons title={section.title} url={`https://www.majlisilm.com${section.path}`} />
      </header>

      {section.methodology && <p className="fg-method">{section.methodology}</p>}

      <div className="fg-search">
        <input
          type="search"
          className="fg-search__input"
          placeholder="ابحث في هذا القسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`بحث في ${section.title}`}
        />
      </div>

      <div className="fg-tabs" role="tablist" aria-label={`أبواب ${section.title}`}>
        {section.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab?.id}
            className={`fg-tab${tab.id === activeTab?.id ? " fg-tab--active" : ""}`}
            onClick={() => setTabId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab?.intro && <p className="fg-intro">{activeTab.intro}</p>}

      <div className="fg-grid">
        {filteredCards.length === 0 ? (
          <p className="fg-empty" role="status">لا نتائج لهذا البحث في الباب الحالي.</p>
        ) : (
          filteredCards.map((card) => (
            <article key={card.id} className="fg-card">
              <h2 className="fg-card__title">{card.title}</h2>
              <p className="fg-card__summary">{card.summary}</p>
              {card.points && card.points.length > 0 && (
                <ul className="fg-card__points">
                  {card.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
              {card.evidence && (
                <div className="fg-card__evidence">
                  <strong>الدليل / المرجع</strong>
                  {card.evidence}
                  {card.evidenceRef ? ` — ${card.evidenceRef}` : ""}
                </div>
              )}
              {card.note && <p className="fg-card__note">{card.note}</p>}
            </article>
          ))
        )}
      </div>

      <nav className="fg-related" aria-label="أقسام ذات صلة">
        <h2 className="fg-related__title">موضوعات ذات صلة</h2>
        <div className="fg-related__grid">
          {section.related.map((r) => (
            <Link key={r.href} href={r.href} className="fg-related__link">
              {r.label}
            </Link>
          ))}
        </div>
      </nav>

      <div style={{ marginTop: "1.75rem" }}>
        <SectionQuiz
          categoryId={section.quizCategoryId}
          title={`اختبر معلوماتك في ${section.title}`}
          count={4}
        />
      </div>
    </div>
  );
}
