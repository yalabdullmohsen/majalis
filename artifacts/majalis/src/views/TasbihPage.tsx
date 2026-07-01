import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { TasbeehCounter } from "@/components/reading/TasbeehCounter";
import { setTaskProgress } from "@/lib/daily-progress";
import {
  computeStreakDays,
  computeTasbeehStats,
  DEFAULT_TASBEEH_AWRAD,
  loadTasbeehFromAccount,
  mergeTasbeehAwrad,
  readTasbeehAwrad,
  syncTasbeehToAccount,
  writeTasbeehAwrad,
  type TasbeehWird,
} from "@/lib/tasbeeh-storage";

const MAX_CUSTOM_TARGET = 99999;

function writeAwrad(items: TasbeehWird[]) {
  writeTasbeehAwrad(items);
  const total = items.reduce((sum, item) => sum + (item.lifetimeTotal || 0), 0);
  setTaskProgress("tasbih", total);
}

export default function TasbihPage() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<TasbeehWird[]>(() => readTasbeehAwrad());
  const [activeId, setActiveId] = useState(() => readTasbeehAwrad()[0]?.id || DEFAULT_TASBEEH_AWRAD[0].id);
  const [newPhrase, setNewPhrase] = useState("");
  const [newTarget, setNewTarget] = useState(33);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const active = items.find((item) => item.id === activeId) || items[0];

  useEffect(() => {
    if (!isLoggedIn) return;
    loadTasbeehFromAccount().then((remote) => {
      if (!remote) return;
      const merged = mergeTasbeehAwrad(readTasbeehAwrad(), remote);
      setItems(merged);
      writeAwrad(merged);
      setSyncNote("تمت مزامنة الأوراد من حسابك");
    });
  }, [isLoggedIn]);

  const aggregateStats = useMemo(() => {
    let today = 0;
    let week = 0;
    let month = 0;
    let total = 0;
    for (const item of items) {
      const s = computeTasbeehStats(item);
      today += s.today;
      week += s.week;
      month += s.month;
      total += s.total;
    }
    const streak = computeStreakDays(items);
    return { today, week, month, total, streak };
  }, [items]);

  const updateItems = useCallback((next: TasbeehWird[]) => {
    setItems(next);
    writeAwrad(next);
    if (isLoggedIn) {
      syncTasbeehToAccount(next).then((r) => {
        if (r.ok) setSyncNote("تم حفظ التقدم في حسابك");
      });
    }
  }, [isLoggedIn]);

  const onWirdChange = useCallback((next: TasbeehWird) => {
    updateItems(items.map((w) => (w.id === next.id ? next : w)));
  }, [items, updateItems]);

  const addWird = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    const item: TasbeehWird = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      phrase,
      target: Math.max(1, Math.min(MAX_CUSTOM_TARGET, newTarget)),
      count: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dailyHistory: {},
      lifetimeTotal: 0,
    };
    updateItems([...items, item]);
    setActiveId(item.id);
    setNewPhrase("");
    setNewTarget(33);
  };

  const deleteActive = () => {
    if (!active || items.length <= 1) return;
    const next = items.filter((item) => item.id !== active.id);
    updateItems(next);
    setActiveId(next[0].id);
  };

  const activeStats = active ? computeTasbeehStats(active) : null;

  return (
    <div className="page-shell narrow tasbih-pro-page tasbih-pro-page--v2" dir="rtl">
      <PageHeader
        eyebrow="الأذكار"
        title="عداد التسبيح"
        subtitle="عدّ بدون حد أقصى، اختر هدفك، واستمر حتى بعد تجاوزه — مع حفظ تلقائي."
      />

      {/* Stats grid */}
      <div className="tasbih-stats-grid tasbih-stats-grid--v2">
        <div className="ui-card tasbih-stat">
          <span>اليوم</span>
          <strong>{aggregateStats.today}</strong>
        </div>
        <div className="ui-card tasbih-stat">
          <span>الأسبوع</span>
          <strong>{aggregateStats.week}</strong>
        </div>
        <div className="ui-card tasbih-stat">
          <span>الشهر</span>
          <strong>{aggregateStats.month}</strong>
        </div>
        <div className="ui-card tasbih-stat">
          <span>الإجمالي</span>
          <strong>{aggregateStats.total}</strong>
        </div>
        {aggregateStats.streak > 0 && (
          <div className="ui-card tasbih-stat tasbih-stat--streak">
            <span>التتابع</span>
            <strong>{aggregateStats.streak} 🔥</strong>
          </div>
        )}
      </div>

      {syncNote && <p className="tasbih-sync-note">{syncNote}</p>}

      {/* Horizontal pill selector */}
      <div className="tasbih-wird-pills" role="tablist" aria-label="اختر الورد">
        {items.map((item) => {
          const s = computeTasbeehStats(item);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active?.id}
              className={`tasbih-wird-pill${item.id === active?.id ? " is-active" : ""}`}
              onClick={() => setActiveId(item.id)}
            >
              <span className="tasbih-pill-phrase">{item.phrase}</span>
              {s.today > 0 && (
                <span className="tasbih-pill-badge">{s.today}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active wird counter */}
      {active && (
        <section className="ui-card tasbih-page-card tasbih-pro-card tasbih-pro-card--v2">
          <p className="tasbih-phrase">{active.phrase}</p>
          <TasbeehCounter
            storageId={`wird-${active.id}`}
            target={active.target}
            label={active.phrase}
            wird={active}
            onWirdChange={onWirdChange}
          />
          {activeStats && (
            <p className="tasbih-progress-label">
              هذا الورد — اليوم: {activeStats.today} · الأسبوع: {activeStats.week} · الشهر: {activeStats.month}
            </p>
          )}
          <div className="tasbih-actions-grid">
            <button
              type="button"
              className="ui-card-btn ui-card-btn--danger"
              onClick={deleteActive}
              disabled={items.length <= 1}
            >
              حذف الورد
            </button>
          </div>
        </section>
      )}

      {/* Add wird form */}
      <section className="ui-card tasbih-add-card">
        <h2>إضافة ورد جديد</h2>
        <div className="tasbih-add-row">
          <input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="مثال: لا حول ولا قوة إلا بالله"
            onKeyDown={(e) => e.key === "Enter" && addWird()}
          />
          <input
            type="number"
            min={1}
            max={MAX_CUSTOM_TARGET}
            value={newTarget}
            onChange={(e) => setNewTarget(Number(e.target.value))}
            aria-label="الهدف اليومي"
          />
          <button type="button" className="ui-card-btn" onClick={addWird}>إضافة</button>
        </div>
      </section>

      <div className="tasbih-offline-note">
        {isLoggedIn
          ? "يُحفظ محلياً ويُزامَن مع حسابك عند التحديث."
          : "يُحفظ في هذا الجهاز. سجّل الدخول للمزامنة مع حسابك."}
      </div>
    </div>
  );
}
