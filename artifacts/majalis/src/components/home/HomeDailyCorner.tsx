"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { getDailyDhikr, getDailyFaida, getDailyHadith, getDailyQa } from "@/lib/daily-content";
import { cleanDisplayText, displayText } from "@/lib/display-text";
import { RequestManager } from "@/lib/request-manager";
import { getQaQuestions } from "@/lib/supabase";

type TabId = "dhikr" | "hadith" | "faida" | "question";

const TABS: { id: TabId; label: string; icon: string; link: string; linkLabel: string }[] = [
  { id: "dhikr",    label: "ذكر",   icon: "📿", link: "/adhkar", linkLabel: "الأذكار" },
  { id: "hadith",   label: "حديث",  icon: "📜", link: "/hadith", linkLabel: "الأحاديث" },
  { id: "faida",    label: "فائدة", icon: "💡", link: "/fawaid", linkLabel: "الفوائد" },
  { id: "question", label: "سؤال",  icon: "❓", link: "/qa",     linkLabel: "الأسئلة" },
];
const TAB_IDS = TABS.map(t => t.id);
const ROTATE_MS = 9000;

export function HomeDailyCorner() {
  const [tab, setTab]         = useState<TabId>("dhikr");
  const [manual, setManual]   = useState(false);
  const [question, setQuestion] = useState<{ question: string; category?: string } | null>(null);
  const [qLoading, setQLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dhikr  = getDailyDhikr();
  const hadith = getDailyHadith();
  const faida  = getDailyFaida();

  /* ── تحميل سؤال اليوم ── */
  useEffect(() => {
    void RequestManager.run("home:daily-question", () => getQaQuestions())
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          const picked = getDailyQa(items) as any;
          if (picked?.question) {
            setQuestion({
              question: picked.question,
              category: picked.qa_categories?.name || picked.category,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setQLoading(false));
  }, []);

  /* ── تدوير تلقائي ── */
  useEffect(() => {
    if (manual) return;
    timerRef.current = setTimeout(() => {
      setTab(cur => TAB_IDS[(TAB_IDS.indexOf(cur) + 1) % TAB_IDS.length] as TabId);
    }, ROTATE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tab, manual]);

  const handleTab = (id: TabId) => {
    setTab(id);
    setManual(true);
  };

  const active = TABS.find(t => t.id === tab)!;

  return (
    <section className="hdc" aria-labelledby="hdc-heading">
      <div className="hdc__head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="hdc-heading" className="hdc__title">الركن اليومي</h2>
        </div>
        <Link href={active.link} className="home-section-link">{active.linkLabel}</Link>
      </div>

      {/* تبويبات */}
      <div className="hdc__tabs" role="tablist" aria-label="الورد اليومي">
        {TABS.map(t => (
          <button
                    type="button"
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`hdc__tab${tab === t.id ? " active" : ""}`}
            onClick={() => handleTab(t.id)}
          >
            <span className="hdc__tab-icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        {/* شريط التقدم للتدوير التلقائي */}
        {!manual && (
          <span className="hdc__progress" aria-hidden="true">
            <span className="hdc__progress-fill" style={{ "--hdc-rotate-ms": `${ROTATE_MS}ms` } as React.CSSProperties} />
          </span>
        )}
      </div>

      {/* المحتوى */}
      <div className="hdc__card ui-card" role="tabpanel">
        {tab === "dhikr" && (
          <div className="hdc__body">
            {dhikr.category && <span className="page-tag">{dhikr.category}</span>}
            <p className="hdc__text">{displayText(dhikr.text)}</p>
            {dhikr.source && <p className="hdc__meta">{dhikr.source}</p>}
          </div>
        )}

        {tab === "hadith" && (
          <div className="hdc__body">
            <blockquote className="hdc__quote">{hadith.text}</blockquote>
            <p className="hdc__meta">
              <strong>الراوي:</strong> {hadith.narrator}
              {hadith.source ? ` — ${hadith.source}` : ""}
              {hadith.grade  ? ` (${hadith.grade})` : ""}
            </p>
            {hadith.meaning && <p className="hdc__meaning">{hadith.meaning}</p>}
          </div>
        )}

        {tab === "faida" && (
          <div className="hdc__body">
            {faida.category && <span className="page-tag">{faida.category}</span>}
            <p className="hdc__text">{displayText(faida.text)}</p>
            {(faida.source || (faida as any).author_name) && (
              <p className="hdc__meta">
                {faida.source && <span>{faida.source}</span>}
                {(faida as any).author_name && <span> · {(faida as any).author_name}</span>}
              </p>
            )}
          </div>
        )}

        {tab === "question" && (
          <div className="hdc__body">
            {qLoading ? (
              <p className="hdc__loading">جاري التحميل…</p>
            ) : question ? (
              <Link href="/qa" className="hdc__qa-link">
                <p className="hdc__question">{cleanDisplayText(question.question)}</p>
                {question.category && (
                  <span className="page-tag">{cleanDisplayText(question.category)}</span>
                )}
                <span className="hdc__qa-cta">اقرأ الإجابة ←</span>
              </Link>
            ) : (
              <p className="hdc__meta">لا يوجد سؤال متاح حالياً</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeDailyCorner;
