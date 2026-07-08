import { useRef, useState } from "react";
import { MapPin, Mic2 } from "lucide-react";
import { Link } from "wouter";
import { MUEZZINS, previewAdhan, stopAdhan } from "@/lib/adhan-audio";
import { loadFavorites, toggleFavorite } from "@/lib/muezzin-favorites";
import { patchAdhanPrefs, loadAdhanPrefs } from "@/lib/adhan-preferences";
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";

const STYLE_CLASS: Record<string, string> = {
  "خاشع":    "khashi",
  "رسمي":    "rasmi",
  "تقليدي":  "taqlidi",
  "كلاسيكي": "kilasiki",
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000) return `${Math.round(n / 1000)}ك`;
  return String(n);
}

export default function MuezzinFavoritesPage() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());

  useEffect(() => {
    applyPageSeo({
      path: "/muezzins/favorites",
      title: "المؤذنون المفضلون | المجلس العلمي",
      description: "أذان مؤذنيك المفضلين — استمع، قيّم، واختر الصوت الافتراضي للأذان في إعداداتك.",
      keywords: ["مؤذنون مفضلون", "أذان مفضل", "تفضيلات أذان", "أصوات إسلامية"],
    });
  }, []);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [savedDefault, setSavedDefault] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    stopAdhan();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  const defaultMuezzinId = loadAdhanPrefs().defaultMuezzinId;
  const favList = MUEZZINS.filter((m) => favorites.has(m.id));

  function handleRemove(id: string) {
    toggleFavorite(id);
    setFavorites(loadFavorites());
  }

  function handlePreview(id: string, _audioUrl: string) {
    if (previewing === id) { stopAdhan(); setPreviewing(null); return; }
    stopAdhan();
    const m = MUEZZINS.find((m) => m.id === id);
    if (!m) return;
    const audio = previewAdhan(m);
    setPreviewing(id);
    audio.addEventListener("ended", () => setPreviewing(null), { once: true });
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => setPreviewing((p) => (p === id ? null : p)), 16_000);
  }

  function handleSetDefault(id: string) {
    patchAdhanPrefs({ defaultMuezzinId: id });
    if (timerRef.current) clearTimeout(timerRef.current);
    setSavedDefault(true);
    timerRef.current = setTimeout(() => setSavedDefault(false), 2500);
  }

  return (
    <div className="mzf-page">
      <Link href="/muezzins">
        <button type="button" className="mzf-back-btn">← مكتبة المؤذنين</button>
      </Link>

      <h1 className="mzf-title">❤️ المؤذنون المفضلون</h1>
      <p className="mzf-subtitle">
        {favList.length > 0
          ? `${favList.length} مؤذن في قائمة مفضلتك`
          : "لا يوجد مؤذنون مفضلون بعد — اضغط 🤍 في الصفحة الرئيسية لإضافتهم."}
      </p>

      {savedDefault && (
        <div className="mzf-saved-notice">✓ تم تعيين المؤذن الافتراضي بنجاح</div>
      )}

      {favList.length === 0 ? (
        <div className="mzf-empty">
          <div className="mzf-empty__icon">🤍</div>
          <p className="mzf-empty__msg">قائمة مفضلتك فارغة</p>
          <Link href="/muezzins">
            <button type="button" className="mzf-explore-btn">استكشف المؤذنين</button>
          </Link>
        </div>
      ) : (
        <div className="mzf-list">
          {favList.map((m) => {
            const styleCls = STYLE_CLASS[m.style] ?? "default";
            const isPlaying = previewing === m.id;
            const isDefault = defaultMuezzinId === m.id;
            return (
              <div key={m.id} className="mzf-card">
                <div className="mzf-card__avatar" aria-hidden="true"><Mic2 size={24} strokeWidth={1.4} /></div>
                <div className="mzf-card__info">
                  <div className="mzf-card__name">
                    {m.name}
                    {isDefault && <span className="mzf-card__default-tag">افتراضي</span>}
                  </div>
                  <div className="mzf-card__origin"><MapPin size={11} strokeWidth={1.8} aria-hidden="true" /> {m.origin} · {m.country}</div>
                  <div className="mzf-card__tags">
                    <span className={`mzf-style-badge mzf-style-badge--${styleCls}`}>{m.style}</span>
                    <span className="mzf-card__rating">★ {m.rating}</span>
                    <span className="mzf-card__followers">{formatNum(m.followers)} متابع</span>
                  </div>
                </div>
                <div className="mzf-card__actions">
                  <button
                    type="button"
                    onClick={() => handlePreview(m.id, m.audioUrl)}
                    className={`mzf-play-btn${isPlaying ? " is-playing" : ""}`}
                    title={isPlaying ? "إيقاف" : "معاينة"}
                  >
                    {isPlaying ? "⏹" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    className="mzf-remove-btn"
                    title="إزالة من المفضلة"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Set default from favorites */}
          <div className="mzf-set-default">
            <p className="mzf-set-default__title">تعيين مؤذن افتراضي من المفضلة:</p>
            <div className="mzf-set-default__list">
              {favList.map((m) => (
                <div key={m.id} className="mzf-set-default__row">
                  <span className="mzf-set-default__name">{m.name}</span>
                  {defaultMuezzinId === m.id ? (
                    <span className="mzf-set-default__current">✓ افتراضي حالياً</span>
                  ) : (
                    <button type="button" onClick={() => handleSetDefault(m.id)} className="mzf-set-default__btn">
                      تعيين
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
