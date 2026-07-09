import { Library } from "lucide-react";
import { Link } from "wouter";
import type { RAGSource } from "@/lib/rag-service";

interface Props {
  source: RAGSource;
  compact?: boolean;
}

export function SourceCard({ source, compact = false }: Props) {
  const grade = source.metadata?.grade as string | undefined;
  const typeMod = `src-type--${String(source.content_type).replace(/_/g, "-")}`;

  const card = (
    <div className={`src-card ${typeMod}${compact ? " src-card--compact" : ""}`}>
      {/* شريط ملوَّن جانبي */}
      <div className="absolute top-0 right-0 h-full w-1 rounded-r-xl sc-color-bar" />

      <div className="pr-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* رقم المصدر */}
          <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full min-w-[1.4rem] text-center sc-color-bg">
            {source.index}
          </span>
          {/* نوع المحتوى */}
          <span className="text-xs text-white px-2 py-0.5 rounded font-medium sc-color-bg">
            {source.type_label}
          </span>
          {/* درجة الحديث */}
          {grade && <span className="src-grade-badge">{grade}</span>}
          {/* مؤشر الموثوقية */}
          <span className="src-authority">{source.authority}% موثوقية</span>
        </div>

        {/* العنوان */}
        <p className={`src-title${compact ? " src-title--compact" : ""}`}>
          {source.title}
        </p>

        {/* المقتطف */}
        {!compact && source.excerpt && (
          <p className="src-excerpt">{source.excerpt}</p>
        )}

        {/* المصدر */}
        {source.source_ref && (
          <p className="src-ref">
            <Library size={11} className="inline ml-1" />{source.source_ref}
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
