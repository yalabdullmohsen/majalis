import { useState } from "react";
import { ClipboardCopy, Library, Save, Scale } from "lucide-react";
import { SourceCard } from "./SourceCard";
import type { RAGResult, ContentType } from "@/lib/rag-service";

interface Props {
  result: RAGResult;
  onSave?: () => void;
}

type Tab = "answer" | "hadith" | "fiqh" | "lessons" | "books" | "opinions" | "all";

const TAB_CONFIG: { key: Tab; label: string; types: ContentType[] | null }[] = [
  { key: "answer",  label: "الجواب",      types: null },
  { key: "hadith",  label: "أحاديث",      types: ["hadith"] },
  { key: "fiqh",    label: "فتاوى وقرارات", types: ["fiqh_decision", "fatwa", "ruling"] },
  { key: "lessons", label: "دروس",        types: ["lesson"] },
  { key: "books",   label: "كتب",         types: ["book"] },
  { key: "opinions",label: "آراء متعددة", types: null },
  { key: "all",     label: "كل المصادر",  types: null },
];

/** تلوين أرقام المراجع في النص */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div dir="rtl" className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
      {parts.map((part, i) => {
        if (/^\[\d+\]$/.test(part)) {
          const num = part.slice(1, -1);
          return <sup key={i} className="ra-ref-sup">[{num}]</sup>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/** شارة جودة الإجابة */
function QualityBadge({ quality }: { quality: string }) {
  const config = {
    full:       { label: "جواب مكتمل",   cls: "ra-badge--full" },
    partial:    { label: "جواب جزئي",    cls: "ra-badge--partial" },
    no_sources: { label: "مصادر محدودة", cls: "ra-badge--dim" },
    blocked:    { label: "توجيه مباشر",  cls: "ra-badge--dim" },
  }[quality] || { label: quality, cls: "ra-badge--dim" };

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

export function ResearchAnswer({ result, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("answer");

  const visibleTabs = TAB_CONFIG.filter((t) => {
    if (t.key === "opinions") return result.hasOpinions && result.opinions?.length > 0;
    if (t.key === "all")      return result.sources?.length > 0;
    if (t.key === "answer")   return true;
    if (!t.types)             return false;
    return result.sources?.some((s) => t.types!.includes(s.content_type));
  });

  function getSourcesForTab(tab: Tab): RAGResult["sources"] {
    const config = TAB_CONFIG.find((t) => t.key === tab);
    if (!config?.types) return result.sources || [];
    return (result.sources || []).filter((s) => config.types!.includes(s.content_type));
  }

  return (
    <div dir="rtl" className="space-y-4">
      {/* شريط الجودة */}
      <div className="ra-meta-row">
        <QualityBadge quality={result.quality} />
        {result.sources?.length > 0 && (
          <span className="ra-source-count">{result.sources.length} مصدر مُسترجَع</span>
        )}
        {result.fromCache && <span className="ra-from-cache">من الذاكرة المؤقتة</span>}
        {result.durationMs && (
          <span className="ra-duration">{(result.durationMs / 1000).toFixed(1)}ث</span>
        )}
      </div>

      {/* تبويبات */}
      <div className="ra-tabs-bar">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`ra-tab${activeTab === t.key ? " ra-tab--active" : ""}`}
            aria-pressed={activeTab === t.key}
          >
            {t.label}
            {t.key !== "answer" && t.key !== "opinions" && t.types && (
              <span className="mr-1 text-xs opacity-70">
                ({getSourcesForTab(t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* محتوى التبويب */}
      <div className="min-h-[200px]">

        {/* تبويب الجواب */}
        {activeTab === "answer" && (
          <div className="space-y-4">
            <div className="ra-answer-box">
              <AnswerText text={result.answer} />
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(result.answer).catch(() => {}); }}
                className="ra-action-btn"
              >
                <ClipboardCopy size={14} className="inline ml-1" />نسخ الجواب
              </button>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  className="citation-btn citation-btn--primary"
                >
                  <Save size={14} className="inline ml-1" />حفظ في المكتبة
                </button>
              )}
            </div>

            {/* المصادر الأصلية (مختصرة) */}
            {result.sources?.length > 0 && (
              <div>
                <p className="ra-sources-label">المصادر الأصلية</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.slice(0, 4).map((s) => (
                    <SourceCard key={`${s.content_type}:${s.index}`} source={s} compact />
                  ))}
                </div>
                {result.sources.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="ra-show-all"
                  >
                    عرض جميع المصادر ({result.sources.length}) ←
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* تبويب آراء متعددة */}
        {activeTab === "opinions" && (
          <div className="space-y-3">
            <div className="ra-opinions-note">
              <Scale size={13} className="inline ml-1" />تعدّدت آراء العلماء في هذه المسألة. يعرض النظام الأقوال بمصادرها ولا يُرجِّح بنفسه.
            </div>
            <div className="space-y-3">
              {result.opinions?.map((op, i) => (
                <div key={i} className="ra-opinion-card">
                  <div className="flex items-start gap-3">
                    <span className="ra-opinion-num">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="ra-opinion-title">{op.title}</p>
                      <p className="ra-opinion-excerpt">{op.excerpt}</p>
                      <p className="ra-opinion-source">
                        <Library size={11} className="inline ml-1" />{op.source}
                        {op.source_url && (
                          <a href={op.source_url} target="_blank" rel="noopener noreferrer"
                            className="ra-opinion-link">
                            المصدر الأصلي ↗
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تبويبات المصادر */}
        {["hadith", "fiqh", "lessons", "books", "all"].includes(activeTab) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getSourcesForTab(activeTab).length === 0 ? (
              <div className="ra-empty">لا توجد نتائج في هذا التصنيف</div>
            ) : (
              getSourcesForTab(activeTab).map((s) => (
                <SourceCard key={`${s.content_type}:${s.index}`} source={s} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
