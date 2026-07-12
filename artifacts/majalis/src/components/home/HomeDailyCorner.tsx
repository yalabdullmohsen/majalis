import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { BookOpen, HelpCircle, Lightbulb, RotateCw, Scroll } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDailyAyah, getDailyDhikr, getDailyFaida, getDailyHadith, getDailyQa } from "@/lib/daily-content";
import { cleanDisplayText, displayText } from "@/lib/display-text";
import { RequestManager } from "@/lib/request-manager";
import { getQaQuestions } from "@/lib/supabase";
import { ShareButton } from "@/components/ShareButton";

type TabId = "dhikr" | "ayah" | "hadith" | "faida" | "question";

const TABS: { id: TabId; label: string; Icon: LucideIcon; link: string; linkLabel: string }[] = [
  { id: "dhikr",    label: "ذكر",   Icon: RotateCw,  link: "/adhkar", linkLabel: "الأذكار" },
  { id: "ayah",     label: "آية",   Icon: BookOpen,  link: "/quran",  linkLabel: "القرآن"  },
  { id: "hadith",   label: "حديث",  Icon: Scroll,    link: "/hadith", linkLabel: "الأحاديث" },
  { id: "faida",    label: "فائدة", Icon: Lightbulb, link: "/fawaid", linkLabel: "الفوائد" },
  { id: "question", label: "سؤال",  Icon: HelpCircle, link: "/qa",   linkLabel: "الأسئلة" },
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
  const ayah   = getDailyAyah();
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 11.5,6.5 18,6.5 13,10.5 15,17 9,13 3,17 5,10.5 0,6.5 6.5,6.5" fill="#176B57"/>
            <circle cx="9" cy="9" r="2.5" fill="none" stroke="#176B57" strokeWidth="0.8"/>
          </svg>
          <div>
            <p className="home-eyebrow">ورد يومي</p>
            <h2 id="hdc-heading" className="hdc__title">الركن اليومي</h2>
          </div>
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
            <span className="hdc__tab-icon" aria-hidden="true"><t.Icon size={16} strokeWidth={1.8} /></span>
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
            <ShareButton title="ذكر اليوم" text={`${displayText(dhikr.text)}${dhikr.source ? `\n— ${dhikr.source}` : ""}`} size="sm" className="hdc__share" />
          </div>
        )}

        {tab === "ayah" && (
          <div className="hdc__body">
            <span className="page-tag">{ayah.surah} — الآية {ayah.ayahNumber}</span>
            <blockquote className="hdc__quote hdc__quote--quran" dir="rtl" lang="ar">{ayah.text}</blockquote>
            <p className="hdc__meta">{ayah.reference}</p>
            {ayah.meaning && <p className="hdc__meaning">{ayah.meaning}</p>}
            <ShareButton title="آية اليوم" text={`${ayah.text}\n— ${ayah.surah}، الآية ${ayah.ayahNumber}`} size="sm" className="hdc__share" />
          </div>
        )}

        {tab === "hadith" && (
          <div className="hdc__body">
            <blockquote className="hdc__quote">{hadith.text}</blockquote>
            <p className="hdc__meta">
              <strong>الراوي:</strong> {hadith.narrator}
              {hadith.source ? `، ${hadith.source}` : ""}
              {hadith.grade  ? ` (${hadith.grade})` : ""}
            </p>
            {hadith.meaning && <p className="hdc__meaning">{hadith.meaning}</p>}
            <ShareButton title="حديث اليوم" text={`${hadith.text}\n— ${hadith.narrator}${hadith.source ? ` | ${hadith.source}` : ""}`} size="sm" className="hdc__share" />
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
            <ShareButton title="فائدة اليوم" text={displayText(faida.text)} size="sm" className="hdc__share" />
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
