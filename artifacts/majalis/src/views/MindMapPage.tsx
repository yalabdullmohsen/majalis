import "@/styles/mind-map.css";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronLeft, ExternalLink, Map, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { MIND_MAPS, MIND_MAP_CATEGORIES, type MindMap, type MindMapNode } from "@/lib/mind-maps-data";
import { arabicMatchAny } from "@/lib/arabic-search";

/* ═══════════════════════════════════════════════════
   مكوّن عقدة الخريطة الذهنية (قابلة للطيّ)
═══════════════════════════════════════════════════ */
function MindNode({
  node,
  depth = 0,
  defaultOpen = false,
}: {
  node: MindMapNode;
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  const toggle = useCallback(() => {
    if (hasChildren) setOpen(o => !o);
  }, [hasChildren]);

  const content = (
    <div
      className={`mm-node mm-node--d${Math.min(depth, 4)}`}
      style={depth === 0 ? {} : { marginRight: `${Math.min(depth, 3) * 1.1}rem` }}
    >
      <button
        type="button"
        className={`mm-node__label${!hasChildren ? " mm-node__label--leaf" : ""}${open ? " mm-node__label--open" : ""}`}
        onClick={toggle}
        aria-expanded={hasChildren ? open : undefined}
      >
        {hasChildren && (
          <span className="mm-node__icon" aria-hidden="true">
            {open ? <ChevronDown size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
          </span>
        )}
        <span className="mm-node__text">{node.label}</span>
        {node.href && (
          <Link
            href={node.href}
            className="mm-node__link"
            onClick={e => e.stopPropagation()}
            aria-label={`فتح ${node.label}`}
          >
            <ExternalLink size={11} strokeWidth={2} />
          </Link>
        )}
      </button>

      {hasChildren && open && (
        <div className="mm-node__children">
          {node.children!.map(child => (
            <MindNode key={child.id} node={child} depth={depth + 1} defaultOpen={depth < 1} />
          ))}
        </div>
      )}
    </div>
  );

  return content;
}

/* ═══════════════════════════════════════════════════
   عدّ الفروع الكلي في الخريطة
═══════════════════════════════════════════════════ */
function countNodes(node: MindMapNode): number {
  if (!node.children?.length) return 1;
  return 1 + node.children.reduce((acc, c) => acc + countNodes(c), 0);
}

/* ═══════════════════════════════════════════════════
   بطاقة الخريطة الذهنية الموسّعة
═══════════════════════════════════════════════════ */
function MindMapCard({ map, forceOpen, onInteract }: { map: MindMap; forceOpen?: boolean; onInteract?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const nodeCount = useMemo(() => countNodes(map.root), [map.root]);
  const isOpen = forceOpen !== undefined ? forceOpen : expanded;

  const toggle = () => {
    if (forceOpen !== undefined) {
      setExpanded(!forceOpen);
      onInteract?.();
    } else {
      setExpanded(e => !e);
    }
  };

  return (
    <div className={`mm-card${isOpen ? " mm-card--open" : ""}`}>
      <button
        type="button"
        className="mm-card__head"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <div className="mm-card__meta">
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span className="mm-card__category">{map.category}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(31,77,58,0.5)", background: "rgba(31,77,58,0.06)", borderRadius: "4px", padding: "0.1rem 0.4rem" }}>
              {nodeCount} عقدة
            </span>
          </div>
          <h3 className="mm-card__title">{map.title}</h3>
          {map.description && <p className="mm-card__desc">{map.description}</p>}
        </div>
        <span className="mm-card__toggle" aria-hidden="true">
          {isOpen ? <X size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
        </span>
      </button>

      {isOpen && (
        <div className="mm-card__body">
          <MindNode node={map.root} depth={0} defaultOpen />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   الصفحة الرئيسية
═══════════════════════════════════════════════════ */
export default function MindMapPage() {
  const [activeCategory, setActiveCategory] = useState<string>("الكل");
  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    applyPageSeo({
      path: "/mind-map",
      title: "الخرائط الذهنية | المجلس العلمي",
      description: "خرائط ذهنية تفاعلية تُنظّم العلوم الإسلامية، الفقه والعقيدة والحديث والسيرة وطريق التعلم.",
      keywords: ["خريطة ذهنية", "علوم إسلامية", "تنظيم المعرفة", "الفقه", "العقيدة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "الخرائط الذهنية للعلوم الإسلامية",
          url: "https://majlisilm.com/mind-map",
          description: "خرائط ذهنية تفاعلية تنظّم العلوم الإسلامية من فقه وعقيدة وحديث وسيرة",
          about: { "@type": "Thing", name: "العلوم الإسلامية وتنظيمها المعرفي" },
        },
      ],
    });
  }, []);

  const filtered = useMemo(() => {
    let list = activeCategory === "الكل" ? MIND_MAPS : MIND_MAPS.filter(m => m.category === activeCategory);
    if (search.trim()) list = list.filter(m => arabicMatchAny([m.title, m.category, m.description ?? ""], search));
    return list;
  }, [activeCategory, search]);

  return (
    <div className="mm-page">
      {/* رأس */}
      <div className="mm-hero">
        <div className="mm-hero__icon" aria-hidden="true">
          <Map size={32} strokeWidth={1.5} />
        </div>
        <h1 className="mm-hero__title">الخرائط الذهنية</h1>
        <p className="mm-hero__sub">
          نظّم معرفتك بالعلوم الإسلامية عبر خرائط ذهنية تفاعلية قابلة للطيّ والتوسيع
        </p>
      </div>

      {/* فلتر الفئات */}
      <div className="mm-filters" role="tablist" aria-label="تصفية الخرائط">
        {MIND_MAP_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            className={`mm-filter-btn${activeCategory === cat ? " mm-filter-btn--active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* بحث */}
      <div className="mm-search-wrap">
        <input
          type="search"
          className="ds-input mm-search-input"
          placeholder="ابحث في الخرائط الذهنية..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في الخرائط الذهنية"
        />
      </div>

      {/* أزرار التوسيع والطيّ */}
      {filtered.length > 0 && (
        <div className="mm-batch-btns">
          <button
            type="button"
            className={`mm-batch-btn${expandAll === true ? " mm-batch-btn--active" : ""}`}
            onClick={() => setExpandAll(true)}
            aria-pressed={expandAll === true}
          >
            <ChevronDown size={14} strokeWidth={2.5} />
            توسيع الكل
          </button>
          <button
            type="button"
            className={`mm-batch-btn${expandAll === false ? " mm-batch-btn--active" : ""}`}
            onClick={() => setExpandAll(false)}
            aria-pressed={expandAll === false}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            طيّ الكل
          </button>
        </div>
      )}

      {/* قائمة الخرائط */}
      <div className="mm-list">
        {filtered.length === 0 ? (
          <p className="mm-empty">لا توجد خرائط في هذه الفئة حتى الآن</p>
        ) : (
          filtered.map(map => (
            <MindMapCard
              key={map.id}
              map={map}
              forceOpen={expandAll}
              onInteract={() => setExpandAll(undefined)}
            />
          ))
        )}
      </div>

      {/* نصيحة */}
      <p className="mm-tip">
        انقر على أي بطاقة لفتح الخريطة الذهنية، واضغط على أي عقدة لطيّها أو توسيعها.
        أيقونة <ExternalLink size={11} strokeWidth={2} className="icon-inline" /> تفتح الصفحة المرتبطة مباشرة.
      </p>
      <div className="twh-share">
        <ShareButtons title="الخرائط الذهنية الإسلامية — المجلس العلمي" url="https://majlisilm.com/mind-map" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith", "fiqh", "aqeeda"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
