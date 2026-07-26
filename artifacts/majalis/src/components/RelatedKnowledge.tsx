import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BookMarked, BookOpen, GraduationCap, Scale, Lightbulb, HelpCircle,
  CheckCircle2, ChevronLeft,
} from "lucide-react";
import { fetchContentRelations, type IntelligentSearchResult } from "@/lib/scholarly-intelligence-service";
import { findEntityByHref, getNeighbors, searchEntityGraph } from "@/lib/entity-graph";
import "@/styles/components/related-knowledge.css";

type Props = {
  kind?: string;
  recordId?: string;
  topicSlug?: string;
  query?: string;
  title?: string;
  limit?: number;
};

const KIND_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  lesson:   GraduationCap,
  book:     BookMarked,
  fatwa:    Scale,
  fawaid:   Lightbulb,
  question: HelpCircle,
  default:  BookOpen,
};

const KIND_LABELS: Record<string, string> = {
  lesson:   "درس",
  book:     "كتاب",
  fatwa:    "فتوى",
  fawaid:   "فائدة",
  question: "سؤال وجواب",
};

function KindIcon({ kind }: { kind?: string }) {
  const Icon = KIND_ICONS[kind ?? ""] ?? KIND_ICONS.default;
  return <Icon size={14} strokeWidth={1.6} aria-hidden="true" />;
}

export function RelatedKnowledge({
  kind, recordId, topicSlug, query,
  title = "مواد ذات صلة",
  limit = 6,
}: Props) {
  const [items,     setItems]     = useState<IntelligentSearchResult[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [algorithm, setAlgorithm] = useState("none");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const graphSeed: IntelligentSearchResult[] = [];
    try {
      const q = query || topicSlug || "";
      if (q) {
        for (const hit of searchEntityGraph(q, limit)) {
          graphSeed.push({
            id: hit.id,
            kind: hit.kind,
            title: hit.title,
            href: hit.href,
            kind_label: hit.kind,
            source_name: hit.subtitle || (hit.reason === "neighbor" ? "مرتبط معرفيًا" : "الرسم المعرفي"),
            verification_status: "verified",
          });
        }
      }
      if (recordId && kind) {
        const entity =
          findEntityByHref(`/${kind}/${recordId}`) ||
          findEntityByHref(`/library/${recordId}`) ||
          findEntityByHref(`/scholars/${recordId}`) ||
          findEntityByHref(`/prophets/${recordId}`) ||
          findEntityByHref(`/nations/${recordId}`);
        if (entity) {
          for (const nb of getNeighbors(entity.id, limit)) {
            graphSeed.push({
              id: nb.id,
              kind: nb.kind,
              title: nb.title,
              href: nb.href,
              kind_label: nb.kind,
              source_name: nb.subtitle || "علاقة معرفية",
              verification_status: "verified",
            });
          }
        }
      }
    } catch {
      /* الرسم المحلي اختياري */
    }

    fetchContentRelations({ kind, recordId, topicSlug, query, limit })
      .then((res) => {
        if (cancelled) return;
        const merged: IntelligentSearchResult[] = [];
        const seen = new Set<string>();
        for (const item of [...graphSeed, ...(res.items || [])]) {
          const key = item.href || item.id || item.title;
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
          if (merged.length >= limit) break;
        }
        setItems(merged);
        setAlgorithm(graphSeed.length ? "entity-graph+relations" : res.algorithm);
      })
      .catch(() => {
        if (!cancelled) {
          setItems(graphSeed.slice(0, limit));
          setAlgorithm(graphSeed.length ? "entity-graph" : "none");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [kind, recordId, topicSlug, query, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside className="rk-aside" aria-label={title}>
      <div className="rk-head">
        <h2 className="rk-title">{title}</h2>
        {algorithm !== "none" && (
          <span className="rk-algo-badge">اقتراحات ذكية</span>
        )}
      </div>

      <div className="rk-grid">
        {items.map((item) => {
          const isVerified = item.verification_status === "verified";
          const href = item.href || `/search/${encodeURIComponent(item.title || "")}`;
          const kindLabel = KIND_LABELS[item.kind_label ?? ""] ?? item.kind_label;

          return (
            <Link
              key={item.id || item.href}
              href={href}
              className="rk-card"
            >
              {/* الشريط الجانبي الملوّن */}
              <div className="rk-card__bar" />

              <div className="rk-card__body">
                {/* رأس البطاقة */}
                <div className="rk-card__head">
                  <span className="rk-card__kind">
                    <KindIcon kind={item.kind_label} />
                    {kindLabel}
                  </span>
                  {isVerified && (
                    <span className="rk-card__verified">
                      <CheckCircle2 size={11} aria-hidden="true" /> موثّق
                    </span>
                  )}
                </div>

                {/* العنوان */}
                <p className="rk-card__title">{item.title}</p>

                {/* المصدر */}
                {item.source_name && (
                  <p className="rk-card__source">{item.source_name}</p>
                )}
              </div>

              <ChevronLeft size={14} className="rk-card__arrow" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
