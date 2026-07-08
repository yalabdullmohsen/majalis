import { useEffect, useRef, useState } from "react";
import { BookOpen, Building2, Cog, Heart, MapPin, Mic2, Moon, Music2, Star, Tag } from "lucide-react";
import { Link, useRoute } from "wouter";
import {
  getMuezzin,
  playAdhan,
  stopAdhan,
  MUEZZINS,
} from "@/lib/adhan-audio";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  PRAYER_ARABIC,
  PRAYER_ICON,
  PRAYER_KEYS,
} from "@/lib/adhan-preferences";
import {
  toggleFavorite,
  isFavorite,
  saveRating,
  getUserRating,
} from "@/lib/muezzin-favorites";
import { applyPageSeo } from "@/lib/seo";

const STYLE_CLASS: Record<string, string> = {
  "خاشع":    "khashi",
  "رسمي":    "rasmi",
  "تقليدي":  "taqlidi",
  "كلاسيكي": "kilasiki",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="mzd-stars-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`mzd-star${i <= Math.round(rating) ? " is-active" : ""}`}>★</span>
      ))}
    </span>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون`;
  if (n >= 1_000) return `${Math.round(n / 1000)} ألف`;
  return String(n);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlayState = { key: "fajr" | "general" | null };

export default function MuezzinDetailPage() {
  const [, params] = useRoute("/muezzins/:id");
  const id = params?.id ?? "";
  const muezzin = getMuezzin(id);

  useEffect(() => {
    applyPageSeo({
      path: "/muezzins",
      title: `${muezzin?.name || "مؤذن"} | أذان | المجلس العلمي`,
      description: `استمع لتلاوات ${muezzin?.name || "المؤذن"} — أذان مباشر وتسجيلات إسلامية متنوعة.`,
      keywords: ["أذان", "مؤذن", "تلاوات أذان", "صوت مؤذن", "أذان إسلامي"],
    });
  }, [muezzin?.name]);

  const [playState, setPlayState] = useState<PlayState>({ key: null });
  const [saved, setSaved] = useState(false);
  const [fav, setFav] = useState(() => isFavorite(muezzin.id));
  const [userRating, setUserRating] = useState(() => getUserRating(muezzin.id));
  const [hoverStar, setHoverStar] = useState(0);
  const [ratedFlash, setRatedFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefs = loadAdhanPrefs();
  const isDefault = prefs.defaultMuezzinId === muezzin.id;
  const styleMod = STYLE_CLASS[muezzin.style] ?? "khashi";

  useEffect(() => () => {
    stopAdhan();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function handlePlay(type: "fajr" | "general") {
    if (playState.key === type) {
      stopAdhan();
      setPlayState({ key: null });
      return;
    }
    stopAdhan();
    const audio = playAdhan(muezzin, type === "fajr");
    setPlayState({ key: type });
    audio.addEventListener("ended", () => setPlayState({ key: null }), { once: true });
  }

  function handleSetDefault() {
    patchAdhanPrefs({ defaultMuezzinId: muezzin.id });
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaved(true);
    timerRef.current = setTimeout(() => setSaved(false), 2500);
  }

  function handleToggleFav() {
    const next = toggleFavorite(muezzin.id);
    setFav(next);
  }

  function handleRate(stars: number) {
    saveRating(muezzin.id, stars);
    setUserRating(stars);
    if (timerRef.current) clearTimeout(timerRef.current);
    setRatedFlash(true);
    timerRef.current = setTimeout(() => setRatedFlash(false), 2000);
  }

  const related = MUEZZINS
    .filter((m) => m.id !== muezzin.id && (m.style === muezzin.style || m.country === muezzin.country))
    .slice(0, 3);

  return (
    <div className="mzd-page">
      {/* Back */}
      <Link href="/muezzins">
        <button type="button" className="mzd-back-btn">
          ← مكتبة المؤذنين
        </button>
      </Link>

      {/* Hero Card */}
      <div className="mzd-hero">
        <div className="mzd-hero__pattern" aria-hidden="true" />

        <div className="mzd-hero__icon" aria-hidden="true"><Mic2 size={36} strokeWidth={1.4} /></div>

        <h1 className="mzd-hero__name">{muezzin.name}</h1>
        <div className="mzd-hero__origin"><MapPin size={13} strokeWidth={2} aria-hidden="true" /> {muezzin.origin} · {muezzin.country}</div>

        <span className={`mzd-style-badge mzd-style-badge--${styleMod}`}>
          {muezzin.style} · {muezzin.category}
        </span>

        <div className="mzd-hero__stats">
          <div className="mzd-hero__stat">
            <div className="mzd-hero__stat-value">{muezzin.rating}</div>
            <div className="mzd-hero__stat-label">التقييم</div>
          </div>
          <div className="mzd-hero__stat">
            <div className="mzd-hero__stat-value">{formatNum(muezzin.totalRatings)}</div>
            <div className="mzd-hero__stat-label">تقييم</div>
          </div>
          <div className="mzd-hero__stat">
            <div className="mzd-hero__stat-value">{formatNum(muezzin.followers)}</div>
            <div className="mzd-hero__stat-label">متابع</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleFav}
          className={`mzd-fav-btn${fav ? " is-fav" : ""}`}
        >
          <Heart size={15} strokeWidth={1.8} aria-hidden="true" /> {fav ? "في المفضلة" : "أضف للمفضلة"}
        </button>
      </div>

      {/* Default status banner */}
      {(isDefault || saved) && (
        <div className="mzd-banner">
          ✓ {isDefault ? "هذا هو مؤذنك الافتراضي الحالي" : "تم تعيينه كمؤذن افتراضي بنجاح"}
        </div>
      )}

      {/* Biography */}
      <Section title={<><BookOpen size={16} strokeWidth={1.8} aria-hidden="true" /> نبذة</>}>
        <p className="mzd-bio">{muezzin.biography}</p>
      </Section>

      {/* Rating */}
      <Section title={<><Star size={16} strokeWidth={1.8} aria-hidden="true" /> التقييم</>}>
        <div className="mzd-rating-row">
          <StarRating rating={muezzin.rating} />
          <span className="mzd-rating-num">{muezzin.rating}</span>
          <span className="mzd-rating-label">من أصل 5.0 · {formatNum(muezzin.totalRatings)} تقييم</span>
        </div>

        <div className="mzd-user-rating">
          <div className="mzd-user-rating__label">
            {userRating > 0 ? "تقييمك:" : "قيّم هذا المؤذن:"}
          </div>
          <div className="mzd-user-rating__stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => handleRate(star)}
                className={`mzd-star-btn${star <= (hoverStar || userRating) ? " is-active" : ""}`}
                title={`${star} نجوم`}
              >
                ★
              </button>
            ))}
          </div>
          {ratedFlash && <div className="mzd-flash">✓ شكراً على تقييمك!</div>}
        </div>
      </Section>

      {/* Tags */}
      <Section title={<><Tag size={16} strokeWidth={1.8} aria-hidden="true" /> التصنيفات</>}>
        <div className="mzd-tags">
          {muezzin.tags.map((tag) => (
            <span key={tag} className="mzd-tag">{tag}</span>
          ))}
        </div>
      </Section>

      {/* Audio player */}
      <Section title={<><Music2 size={16} strokeWidth={1.8} aria-hidden="true" /> أذانات الفريضة الخمس</>}>
        <p className="mzd-audio-hint">
          اضغط على أي وقت للاستماع · الأذانات بصوت {muezzin.name}
        </p>

        <AudioRow
          label="الأذان العام"
          sublabel="يُشغَّل للظهر والعصر والمغرب والعشاء"
          duration={muezzin.durationSec}
          isPlaying={playState.key === "general"}
          onPlay={() => handlePlay("general")}
          icon={<Building2 size={18} strokeWidth={1.5} />}
        />

        {muezzin.fajrUrl ? (
          <AudioRow
            label="أذان الفجر"
            sublabel='بزيادة "الصلاة خير من النوم"'
            duration={muezzin.durationSec + 15}
            isPlaying={playState.key === "fajr"}
            onPlay={() => handlePlay("fajr")}
            icon={<Moon size={18} strokeWidth={1.5} />}
            highlight
          />
        ) : (
          <div className="mzd-fajr-fallback">
            <span className="mzd-fajr-fallback__icon" aria-hidden="true"><Moon size={20} strokeWidth={1.5} /></span>
            <div className="mzd-fajr-fallback__info">
              <div className="mzd-fajr-fallback__title">أذان الفجر</div>
              <div className="mzd-fajr-fallback__subtitle">يُستخدم الأذان العام للفجر لهذا المؤذن</div>
            </div>
          </div>
        )}

        <div className="mzd-prayer-grid">
          <div className="mzd-prayer-grid__title">توزيع الأذانات على الصلوات:</div>
          <div className="mzd-prayer-rows">
            {PRAYER_KEYS.map((key) => (
              <div key={key} className="mzd-prayer-row">
                <span>{PRAYER_ICON[key]}</span>
                <span className="mzd-prayer-row__name">{PRAYER_ARABIC[key]}</span>
                <span className="mzd-prayer-row__type">
                  {key === "fajr" && muezzin.fajrUrl ? "أذان الفجر الخاص" : "الأذان العام"}
                </span>
                <span className="mzd-prayer-row__duration">
                  {key === "fajr" && muezzin.fajrUrl
                    ? formatDuration(muezzin.durationSec + 15)
                    : formatDuration(muezzin.durationSec)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Set as default */}
      {!isDefault && (
        <button type="button" onClick={handleSetDefault} className="mzd-set-default-btn">
          <Mic2 size={15} strokeWidth={1.8} aria-hidden="true" /> تعيين كمؤذن افتراضي
        </button>
      )}

      <Link href="/adhan-settings">
        <button type="button" className="mzd-settings-link">
          <Cog size={15} strokeWidth={1.8} aria-hidden="true" /> إعدادات الأذان التفصيلية
        </button>
      </Link>

      {/* Related muezzins */}
      {related.length > 0 && (
        <Section title={<><Mic2 size={16} strokeWidth={1.8} aria-hidden="true" /> قد يعجبك أيضاً</>}>
          <div className="mzd-related-list">
            {related.map((m) => (
              <Link key={m.id} href={`/muezzins/${m.id}`}>
                <div className="mzd-related-card">
                  <span className="mzd-related-card__icon" aria-hidden="true"><Mic2 size={18} strokeWidth={1.5} /></span>
                  <div className="mzd-related-card__info">
                    <div className="mzd-related-card__name">{m.name}</div>
                    <div className="mzd-related-card__meta">{m.origin} · {m.style}</div>
                  </div>
                  <div className="mzd-related-card__rating">★ {m.rating}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function AudioRow({ label, sublabel, duration, isPlaying, onPlay, icon, highlight = false }: {
  label: string;
  sublabel: string;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`mzd-audio-row${highlight ? " mzd-audio-row--highlight" : ""}`}>
      <span className="mzd-audio-row__icon" aria-hidden="true">{icon}</span>
      <div className="mzd-audio-row__info">
        <div className="mzd-audio-row__title">{label}</div>
        <div className="mzd-audio-row__subtitle">{sublabel}</div>
      </div>
      <span className="mzd-audio-row__duration">{formatDuration(duration)}</span>
      <button
        type="button"
        onClick={onPlay}
        className={`mzd-audio-row__play${isPlaying ? " is-playing" : ""}`}
        title={isPlaying ? "إيقاف" : "استمع"}
      >
        {isPlaying ? "⏹" : "▶"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mzd-section">
      <h2 className="mzd-section__title">{title}</h2>
      <div className="mzd-section__body">{children}</div>
    </div>
  );
}
