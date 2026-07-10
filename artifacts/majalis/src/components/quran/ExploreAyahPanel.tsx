/**
 * ExploreAyahPanel، الميزة الفريدة لمجالس
 * تعرض كل ما يرتبط بالآية المحددة من محتوى المنصة:
 * دروس، فتاوى، أسئلة، فوائد، قصص أنبياء، الرسم البياني المعرفي.
 *
 * المصدر: intelligentSearch()، نص الآية كاستعلام بحث.
 */
import { useCallback, useEffect, useState } from "react";
import { Bell, BookOpen, Brain, ClipboardList, FileText, GraduationCap, HelpCircle, Landmark, Library, Lightbulb, Link2, Scale, ScrollText, Search, Sparkles, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import {
  intelligentSearch,
  type IntelligentSearchResult,
} from "@/lib/scholarly-intelligence-service";

type Props = {
  surahNum: number;
  ayahNum: number;
  surahName: string;
  ayahText: string;
  onClose: () => void;
};

const KIND_META: Record<string, { label: string; Icon: LucideIcon }> = {
  lesson:        { label: "درس",          Icon: Library         },
  hadith:        { label: "حديث",         Icon: ScrollText      },
  library:       { label: "كتاب",         Icon: BookOpen        },
  fatwa:         { label: "فتوى",         Icon: Landmark        },
  fiqh_decision: { label: "قرار فقهي",   Icon: Scale           },
  fiqh:          { label: "فقه",          Icon: Scale           },
  ruling:        { label: "حكم شرعي",    Icon: ClipboardList   },
  fawaid:        { label: "فائدة",        Icon: Lightbulb       },
  qa:            { label: "سؤال",         Icon: HelpCircle      },
  miracle:       { label: "إعجاز",        Icon: Sparkles        },
  course:        { label: "دورة",         Icon: GraduationCap   },
  update:        { label: "مستجد",        Icon: Bell            },
  knowledge:     { label: "معرفة",        Icon: Brain           },
  topic:         { label: "موضوع",        Icon: Tag             },
};

const ORDER: string[] = [
  "lesson", "fatwa", "fiqh_decision", "fiqh", "ruling",
  "hadith", "qa", "fawaid", "library", "miracle", "course",
  "knowledge", "update", "topic",
];

function groupResults(items: IntelligentSearchResult[]): Map<string, IntelligentSearchResult[]> {
  const map = new Map<string, IntelligentSearchResult[]>();
  for (const item of items) {
    const kind = item.kind || "knowledge";
    const list = map.get(kind) ?? [];
    list.push(item);
    map.set(kind, list);
  }
  const sorted = new Map<string, IntelligentSearchResult[]>();
  for (const k of ORDER) {
    if (map.has(k)) sorted.set(k, map.get(k)!);
  }
  for (const [k, v] of map.entries()) {
    if (!sorted.has(k)) sorted.set(k, v);
  }
  return sorted;
}

function Skeleton() {
  return (
    <div className="eap-skel">
      {[1, 2, 3].map((i) => (
        <div key={i} className="eap-skel__row">
          <div className="eap-skel__avatar" />
          <div className="eap-skel__body">
            <div className="eap-skel__line1" style={{ "--eap-w1": `${60 + i * 10}%` } as React.CSSProperties} />
            <div className="eap-skel__line2" style={{ "--eap-w2": `${40 + i * 8}%` } as React.CSSProperties} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExploreAyahPanel({ ayahNum, surahName, ayahText, onClose }: Props) {
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const queryText = ayahText.replace(/[ً-ٟـ]/g, "").slice(0, 60).trim();
      const res = await intelligentSearch(queryText, { limit: 30 });
      setResults(
        (res.results ?? []).filter(
          (r) => !r.kind?.startsWith("quran") && r.href,
        ),
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [ayahText]);

  useEffect(() => { load(); }, [load]);

  const groups = groupResults(results);
  const total = results.length;

  const handleSelect = (href: string) => {
    onClose();
    navigate(href);
  };

  return (
    <>
      <div className="eap-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`استكشاف آية ${ayahNum} من سورة ${surahName}`}
        className="eap-drawer"
      >
        <div aria-hidden="true" className="eap-handle" />

        <div className="eap-header">
          <div>
            <h2 className="eap-header__title"><Link2 size={16} className="inline ml-1" />استكشف الآية</h2>
            <p className="eap-header__meta">
              سورة {surahName} · الآية {ayahNum}
              {!loading && ` · ${total} مصدر مرتبط`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="eap-close-btn">
            ✕
          </button>
        </div>

        <div className="eap-ayah-preview">
          <p dir="rtl" lang="ar" className="eap-ayah-text">{ayahText}</p>
        </div>

        <div className="eap-results">
          {loading && <Skeleton />}

          {!loading && total === 0 && (
            <div className="eap-empty">
              <p className="eap-empty__icon"><Search size={32} strokeWidth={1.4} /></p>
              <p className="eap-empty__text">لا يوجد محتوى مرتبط بهذه الآية حالياً في المنصة.</p>
            </div>
          )}

          {!loading && total > 0 && (
            <div className="eap-results-pad">
              {Array.from(groups.entries()).map(([kind, items]) => {
                const meta = KIND_META[kind] ?? { label: kind, Icon: FileText };
                return (
                  <section key={kind} className="eap-section">
                    <div className="eap-section__head">
                      <span className="eap-section__icon">{(() => { const I = meta.Icon; return <I size={14} />; })()}</span>
                      <span className="eap-section__label">{meta.label}</span>
                      <span className="eap-section__count">{items.length}</span>
                    </div>

                    {items.slice(0, 4).map((item, i) => (
                      <button
                        key={item.id ?? i}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        className="eap-item-btn"
                      >
                        <div className="eap-item__body">
                          <p className="eap-item__title">{item.title}</p>
                          {item.source_name && (
                            <p className="eap-item__source">{item.source_name}</p>
                          )}
                        </div>
                        <span className="eap-item__arrow">←</span>
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <div className="eap-footer">
          <button type="button" onClick={() => handleSelect("/knowledge-graph")} className="eap-footer__kg-btn">
            الرسم البياني المعرفي ←
          </button>
        </div>
      </div>
    </>
  );
}
