import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { setTaskProgress } from "@/lib/daily-progress";
import { useAuth } from "@/components/AuthProvider";

type Wird = {
  id: string;
  phrase: string;
  target: number;
  count: number;
  createdAt: string;
  updatedAt: string;
  history: Record<string, number>;
};

const MAX_TARGET = 5000;
const STORAGE = "majalis-tasbih-v2";

const DEFAULT_AWRAD: Wird[] = [
  { id: "subhanallah", phrase: "سبحان الله", target: 1000, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: {} },
  { id: "alhamdulillah", phrase: "الحمد لله", target: 500, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: {} },
  { id: "tahleel", phrase: "لا إله إلا الله", target: 700, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: {} },
  { id: "takbir", phrase: "الله أكبر", target: 300, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: {} },
  { id: "salawat", phrase: "الصلاة على النبي ﷺ", target: 5000, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: {} },
];

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
}

function readAwrad(): Wird[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_AWRAD;
}

function writeAwrad(items: Wird[]) {
  localStorage.setItem(STORAGE, JSON.stringify(items));
  const total = items.reduce((sum, item) => sum + item.count, 0);
  setTaskProgress("tasbih", total);
}

export default function TasbihPage() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<Wird[]>(() => readAwrad());
  const [activeId, setActiveId] = useState(() => readAwrad()[0]?.id || DEFAULT_AWRAD[0].id);
  const [newPhrase, setNewPhrase] = useState("");
  const [newTarget, setNewTarget] = useState(100);
  const active = items.find((item) => item.id === activeId) || items[0];

  const stats = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const completed = items.filter((item) => item.count >= item.target).length;
    const days = new Set(items.flatMap((item) => Object.keys(item.history || {}))).size;
    const achievements = [
      total >= 1000 ? "بلغت 1000 ذكر" : null,
      completed > 0 ? "أكملت ورداً واحداً" : null,
      items.length >= 5 ? "خمسة أوراد نشطة" : null,
    ].filter(Boolean);
    return { total, completed, days, achievements };
  }, [items]);

  const updateItems = (next: Wird[]) => {
    setItems(next);
    writeAwrad(next);
  };

  const increment = (delta = 1) => {
    if (!active) return;
    const key = todayKey();
    updateItems(items.map((item) => {
      if (item.id !== active.id) return item;
      const count = Math.min(item.target, Math.max(0, item.count + delta));
      return {
        ...item,
        count,
        updatedAt: new Date().toISOString(),
        history: { ...item.history, [key]: count },
      };
    }));
  };

  const resetActive = () => {
    if (!active) return;
    updateItems(items.map((item) => item.id === active.id ? { ...item, count: 0, updatedAt: new Date().toISOString() } : item));
  };

  const changeTarget = (target: number) => {
    if (!active) return;
    const safe = Math.max(1, Math.min(MAX_TARGET, Math.round(target || 1)));
    updateItems(items.map((item) => item.id === active.id ? { ...item, target: safe, count: Math.min(item.count, safe), updatedAt: new Date().toISOString() } : item));
  };

  const addWird = () => {
    const phrase = newPhrase.trim();
    if (!phrase) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: Wird = {
      id,
      phrase,
      target: Math.max(1, Math.min(MAX_TARGET, newTarget)),
      count: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: {},
    };
    updateItems([...items, item]);
    setActiveId(id);
    setNewPhrase("");
    setNewTarget(100);
  };

  const deleteActive = () => {
    if (!active || items.length <= 1) return;
    const next = items.filter((item) => item.id !== active.id);
    updateItems(next);
    setActiveId(next[0].id);
  };

  const progress = active ? Math.round((active.count / active.target) * 100) : 0;

  return (
    <div className="page-shell narrow tasbih-pro-page">
      <PageHeader eyebrow="الأذكار" title="عداد التسبيح" subtitle="أوراد متعددة تعمل دون اتصال وتحفظ التقدم تلقائياً." />

      <div className="tasbih-stats-grid">
        <div className="ui-card tasbih-stat"><span>الإجمالي</span><strong>{stats.total}</strong></div>
        <div className="ui-card tasbih-stat"><span>أوراد مكتملة</span><strong>{stats.completed}</strong></div>
        <div className="ui-card tasbih-stat"><span>أيام النشاط</span><strong>{stats.days}</strong></div>
        <div className="ui-card tasbih-stat"><span>المزامنة</span><strong>{isLoggedIn ? "جاهزة" : "محلية"}</strong></div>
      </div>

      <div className="tasbih-layout">
        <aside className="ui-card tasbih-wird-list" aria-label="الأوراد">
          {items.map((item) => {
            const itemProgress = Math.round((item.count / item.target) * 100);
            return (
              <button
                key={item.id}
                type="button"
                className={`tasbih-wird-tab${item.id === active?.id ? " is-active" : ""}`}
                onClick={() => setActiveId(item.id)}
              >
                <span>{item.phrase}</span>
                <small>{item.count} / {item.target} · {itemProgress}%</small>
              </button>
            );
          })}
        </aside>

        {active && (
          <section className="ui-card tasbih-page-card tasbih-pro-card">
            <p className="tasbih-phrase">{active.phrase}</p>
            <button type="button" className="tasbih-main-button" onClick={() => increment(1)} aria-label={`زيادة ${active.phrase}`}>
              <span>{active.count}</span>
              <small>اضغط للتسبيح</small>
            </button>
            <div className="tasbeeh-counter__bar tasbih-pro-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <p className="tasbih-progress-label">{progress}% من الهدف اليومي ({active.target})</p>
            <div className="tasbih-actions-grid">
              <button type="button" className="ui-card-btn" onClick={() => increment(10)}>+10</button>
              <button type="button" className="ui-card-btn" onClick={resetActive}>تصفير</button>
              <button type="button" className="ui-card-btn" onClick={deleteActive} disabled={items.length <= 1}>حذف</button>
            </div>
            <label className="tasbih-target-field">
              تغيير الهدف (حد أقصى {MAX_TARGET})
              <input type="number" min={1} max={MAX_TARGET} value={active.target} onChange={(e) => changeTarget(Number(e.target.value))} />
            </label>
            <p className="tasbih-saved">آخر تحديث: {new Date(active.updatedAt).toLocaleString("ar-KW")}</p>
          </section>
        )}
      </div>

      <section className="ui-card tasbih-add-card">
        <h2>إضافة ورد جديد</h2>
        <div className="tasbih-add-row">
          <input value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)} placeholder="مثال: لا حول ولا قوة إلا بالله" />
          <input type="number" min={1} max={MAX_TARGET} value={newTarget} onChange={(e) => setNewTarget(Math.min(MAX_TARGET, Number(e.target.value)))} />
          <button type="button" className="ui-card-btn" onClick={addWird}>إضافة</button>
        </div>
      </section>

      {stats.achievements.length > 0 && (
        <section className="ui-card tasbih-achievements">
          <h2>الإنجازات</h2>
          <ul>
            {stats.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}
          </ul>
        </section>
      )}

      <div className="tasbih-offline-note">
        يعمل Offline ويحفظ في هذا الجهاز. عند تسجيل الدخول تصبح البيانات جاهزة للمزامنة مع حسابك.
      </div>
    </div>
  );
}
