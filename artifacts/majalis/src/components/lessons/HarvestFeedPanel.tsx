import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SourceItemCard } from "@/components/lessons/SourceItemCard";
import {
  isThisWeek,
  isToday,
  loadHarvestFeed,
  feedPriorityScore,
  type HarvestFeedCard,
} from "@/lib/harvest-feed";
import "@/styles/components/harvest-feed-panel.css";

type FeedTab = "today" | "week" | "courses" | "circles" | "women";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "هذا الأسبوع" },
  { id: "courses", label: "دورات" },
  { id: "circles", label: "حلقات" },
  { id: "women", label: "نساء" },
];

const TODAY_LIMIT = 12;
const WEEK_LIMIT = 12;

function filterTab(items: HarvestFeedCard[], tab: FeedTab): HarvestFeedCard[] {
  if (tab === "today") return items.filter((c) => isToday(c.published_at));
  if (tab === "week") return items.filter((c) => isThisWeek(c.published_at));
  if (tab === "courses") return items.filter((c) => c.type === "دورة");
  if (tab === "circles") return items.filter((c) => c.type === "حلقة");
  if (tab === "women") return items.filter((c) => c.audience === "نساء");
  return items;
}

function dedupeBySource(items: HarvestFeedCard[]): HarvestFeedCard[] {
  const seen = new Set<string>();
  const out: HarvestFeedCard[] = [];
  for (const card of items) {
    const srcId = card.sources[0]?.id ?? card.id;
    if (seen.has(srcId)) continue;
    seen.add(srcId);
    out.push(card);
  }
  return out;
}

function sortByPriority(items: HarvestFeedCard[]): HarvestFeedCard[] {
  return [...items].sort((a, b) => {
    const d = feedPriorityScore(b) - feedPriorityScore(a);
    if (d !== 0) return d;
    return Date.parse(b.published_at) - Date.parse(a.published_at);
  });
}

export function HarvestFeedPanel() {
  const [items, setItems] = useState<HarvestFeedCard[]>([]);
  const [tab, setTab] = useState<FeedTab>("today");
  const [openRegister, setOpenRegister] = useState(false);

  useEffect(() => {
    loadHarvestFeed().then(setItems).catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    let list = sortByPriority(filterTab(items, tab));
    if (openRegister) list = list.filter((c) => Boolean(c.register_url));
    list = list.filter((c) => {
      if (!c.starts_at) return true;
      const t = Date.parse(c.starts_at);
      if (!Number.isFinite(t)) return true;
      return t + 2 * 60 * 60 * 1000 >= Date.now();
    });
    list = dedupeBySource(list);
    const limit = tab === "today" ? TODAY_LIMIT : tab === "week" ? WEEK_LIMIT : TODAY_LIMIT;
    return list.slice(0, limit);
  }, [items, tab, openRegister]);

  const todayCount = useMemo(() => items.filter((c) => isToday(c.published_at)).length, [items]);
  if (items.length === 0) return null;

  return (
    <section className="harvest-panel" aria-label="جديد اليوم من المصادر" dir="rtl">
      <header className="harvest-panel__head">
        <div>
          <h2 className="harvest-panel__title">جديد اليوم من المصادر</h2>
          <p className="harvest-panel__sub">
            {todayCount > 0 ? `${todayCount} منشوراً اليوم` : "آخر المنشورات من الجهات المعتمدة"}
            {" · "}
            <Link href="/sources">دليل الجهات</Link>
          </p>
        </div>
        <label className="harvest-panel__toggle">
          <input
            type="checkbox"
            checked={openRegister}
            onChange={(e) => setOpenRegister(e.target.checked)}
          />
          تسجيل مفتوح
        </label>
      </header>
      <nav className="harvest-panel__tabs" aria-label="تصفية المنشورات">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "is-active" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="harvest-panel__grid">
        {filtered.map((card) => (
          <SourceItemCard key={card.id} card={card} compact />
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="harvest-panel__empty">لا منشورات في هذا التبويب حالياً.</p>
      ) : null}
    </section>
  );
}
