import { useState } from "react";
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
          return (
            <sup key={i} className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5 cursor-default">
              [{num}]
            </sup>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/** شارة جودة الإجابة */
function QualityBadge({ quality }: { quality: string }) {
  const config = {
    full:       { label: "جواب مكتمل",  bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    partial:    { label: "جواب جزئي",   bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    no_sources: { label: "مصادر محدودة", bg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    blocked:    { label: "توجيه مباشر",  bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  }[quality] || { label: quality, bg: "bg-gray-100 text-gray-600" };

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.bg}`}>
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
      <div className="flex items-center gap-2 flex-wrap">
        <QualityBadge quality={result.quality} />
        {result.sources?.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {result.sources.length} مصدر مُسترجَع
          </span>
        )}
        {result.fromCache && (
          <span className="text-xs text-blue-500 dark:text-blue-400">من الذاكرة المؤقتة</span>
        )}
        {result.durationMs && (
          <span className="text-xs text-gray-300 dark:text-gray-600 mr-auto">
            {(result.durationMs / 1000).toFixed(1)}ث
          </span>
        )}
      </div>

      {/* تبويبات */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide border-b border-gray-200 dark:border-gray-700">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-t font-medium transition-colors ${
              activeTab === t.key
                ? "bg-emerald-600 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
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
            <div className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-xl p-5">
              <AnswerText text={result.answer} />
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.answer).catch(() => {});
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700
                  text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                📋 نسخ الجواب
              </button>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white
                    rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  💾 حفظ في المكتبة
                </button>
              )}
            </div>

            {/* المصادر الأصلية (مختصرة) */}
            {result.sources?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  المصادر الأصلية
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.slice(0, 4).map((s) => (
                    <SourceCard key={`${s.content_type}:${s.index}`} source={s} compact />
                  ))}
                </div>
                {result.sources.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
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
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800
              rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
              ⚖️ تعدّدت آراء العلماء في هذه المسألة. يعرض النظام الأقوال بمصادرها ولا يُرجِّح بنفسه.
            </div>
            <div className="space-y-3">
              {result.opinions?.map((op, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{op.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2 line-clamp-4">
                        {op.excerpt}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        📚 {op.source}
                        {op.source_url && (
                          <a href={op.source_url} target="_blank" rel="noopener noreferrer"
                            className="mr-2 text-emerald-600 hover:underline">
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

        {/* تبويبات المصادر (حديث / فقه / دروس / كتب) */}
        {["hadith", "fiqh", "lessons", "books", "all"].includes(activeTab) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getSourcesForTab(activeTab).length === 0 ? (
              <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-8">
                لا توجد نتائج في هذا التصنيف
              </div>
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
