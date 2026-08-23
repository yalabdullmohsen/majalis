import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SourceItemCard } from "@/components/lessons/SourceItemCard";
import {
  isThisWeek,
  isToday,
  loadHarvestFeed,
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

function filterTab(items: HarvestFeedCard[], tab: FeedTab): HarvestFeedCard[] {
  if (tab === "today") return items.filter((c) => isToday(c.published_at));
  if (tab === "week") return items.filter((c) => isThisWeek(c.published_at));
  if (tab === "courses") return items.filter((c) => c.type === "دورة");
  if (tab === "circles") return items.filter((c) => c.type === "حلقة");
  if (tab === "women") return items.filter((c) => c.audience === "نساء");
  return items;
}

export function HarvestFeedPanel() {
  const [items, setItems] = useState<HarvestFeedCard[]>([]);
  const [tab, setTab] = useState<FeedTab>("today");
  const [openRegister, setOpenRegister] = useState(false);

  useEffect(() => {
    loadHarvestFeed().then(setItems).catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    let list = filterTab(items, tab);
    if (openRegister) list = list.filter((c) => Boolean(c.register_url));
    return list.slice(0, 12);
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
