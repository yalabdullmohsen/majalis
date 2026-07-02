import { Link } from "wouter";
import type { RAGSource } from "@/lib/rag-service";
import { CONTENT_TYPE_COLOR } from "@/lib/rag-service";

interface Props {
  source: RAGSource;
  compact?: boolean;
}

export function SourceCard({ source, compact = false }: Props) {
  const color = CONTENT_TYPE_COLOR[source.content_type as keyof typeof CONTENT_TYPE_COLOR] || "#374151";
  const grade = source.metadata?.grade as string | undefined;

  const card = (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all
        ${compact ? "p-3" : "p-4"}`}
    >
      {/* شريط ملوَّن جانبي */}
      <div className="absolute top-0 right-0 h-full w-1 rounded-r-xl" style={{ background: color }} />

      <div className="pr-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* رقم المصدر */}
          <span
            className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full min-w-[1.4rem] text-center"
            style={{ background: color }}
          >
            {source.index}
          </span>
          {/* نوع المحتوى */}
          <span className="text-xs text-white px-2 py-0.5 rounded font-medium" style={{ background: color }}>
            {source.type_label}
          </span>
          {/* درجة الحديث */}
          {grade && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
              {grade}
            </span>
          )}
          {/* مؤشر الموثوقية */}
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">
            {source.authority}% موثوقية
          </span>
        </div>

        {/* العنوان */}
        <p className={`font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1
          ${compact ? "text-sm line-clamp-1" : "text-sm line-clamp-2"}`}>
          {source.title}
        </p>

        {/* المقتطف */}
        {!compact && source.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-2">
            {source.excerpt}
          </p>
        )}

        {/* المصدر */}
        {source.source_ref && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            📚 {source.source_ref}
          </p>
        )}
      </div>
    </div>
  );

  if (source.href || source.source_url) {
    const href = source.href || source.source_url || "#";
    const isExternal = href.startsWith("http");
    return isExternal
      ? <a href={href} target="_blank" rel="noopener noreferrer" className="block group">{card}</a>
      : <Link href={href} className="block group">{card}</Link>;
  }

  return <div className="block">{card}</div>;
}
