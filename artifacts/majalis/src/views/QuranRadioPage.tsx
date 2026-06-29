"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-radio-stations";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useRadioPlayer } from "@/components/radio/RadioPlayerProvider";
import { getRadioFavorites, toggleRadioFavorite } from "@/lib/quran-radio-favorites";
import { Icon } from "@/lib/icons";
import "@/styles/quran-media.css";

const STATE_LABELS: Record<string, string> = {
  live: "مباشر",
  connecting: "جاري الاتصال",
  paused: "متوقف",
  idle: "جاهز",
  error: "تعذّر البث",
};

export default function QuranRadioPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => getRadioFavorites());
  const { preferences, updatePreferences } = useUserPreferences();
  const {
    stationId,
    station,
    setStationId,
    playing,
    playerState,
    statusMessage,
    toggle,
    play,
    pause,
    reconnect,
  } = useRadioPlayer();

  useEffect(() => {
    const fromUrl = params.get("station");
    if (fromUrl && QURAN_RADIO_STATIONS.some((s) => s.id === fromUrl)) {
      setStationId(fromUrl);
    }
  }, [params, setStationId]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return QURAN_RADIO_STATIONS;
    return QURAN_RADIO_STATIONS.filter(
      (s) => s.reciterName.includes(q) || s.readingType.includes(q),
    );
  }, [query]);

  const favStations = useMemo(
    () => QURAN_RADIO_STATIONS.filter((s) => favorites.includes(s.id)),
    [favorites],
  );

  const selectStation = (id: string) => {
    setStationId(id);
    setLocation(`/quran-radio?station=${id}`);
    if (stationId === id && playing) {
      pause();
    } else {
      setTimeout(play, 60);
    }
  };

  const toggleFav = (id: string) => {
    setFavorites(toggleRadioFavorite(id));
  };

  return (
    <div className="page-shell quran-radio-page quran-radio-page--v2">
      <PageHeader
        eyebrow="القرآن"
        title="إذاعة القرآن الكريم"
        subtitle="بث مباشر لقرّاء موثوقين — كل محطة مرتبطة بصوت القارئ المسمّى."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran/mushaf" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran" className="quran-subnav__link">القراءة</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link is-active">الإذاعة</Link>
      </nav>

      {station && (
        <section className="radio-now-playing ui-card" aria-label="Now Playing">
          <div className={`radio-wave${playing ? " is-active" : ""}`} aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="radio-now-playing__body">
            <p className="radio-now-playing__label">Now Playing</p>
            <h2>{station.reciterName}</h2>
            <p>{station.readingType} · {station.quality}</p>
            <span className={`radio-status-badge radio-status-badge--${playerState}`}>
              {STATE_LABELS[playerState] || statusMessage}
            </span>
            {statusMessage && playerState === "error" && (
              <p className="radio-now-playing__error" role="alert">{statusMessage}</p>
            )}
          </div>
          <div className="radio-now-playing__controls">
            <button type="button" className="ds-btn ds-btn--primary" onClick={toggle}>
              <Icon name={playing ? "pause" : "play"} size={18} />
              {playing ? "إيقاف" : "تشغيل"}
            </button>
            <button type="button" className="ds-btn ds-btn--ghost" onClick={reconnect}>إعادة الاتصال</button>
            <button type="button" className="ds-btn ds-btn--ghost" onClick={() => toggleFav(station.id)}>
              <Icon name="heart" size={18} />
              {favorites.includes(station.id) ? "مفضّل" : "إضافة للمفضلة"}
            </button>
          </div>
          <label className="radio-volume">
            <Icon name="volume" size={16} />
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.radioVolume}
              onChange={(e) => updatePreferences({ radioVolume: e.target.value })}
              aria-label="مستوى الصوت"
            />
          </label>
        </section>
      )}

      <div className="radio-toolbar">
        <label className="radio-search">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن قارئ..."
            aria-label="بحث في القرّاء"
          />
        </label>
      </div>

      {favStations.length > 0 && (
        <section className="radio-section" aria-labelledby="radio-fav-heading">
          <h2 id="radio-fav-heading" className="radio-section__title">المفضلة</h2>
          <ul className="radio-station-grid">
            {favStations.map((item) => (
              <StationCard
                key={item.id}
                item={item}
                active={stationId === item.id}
                playing={stationId === item.id && playing}
                playerState={stationId === item.id ? playerState : "idle"}
                isFavorite
                onSelect={() => selectStation(item.id)}
                onToggleFav={() => toggleFav(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="radio-section" aria-labelledby="radio-list-heading">
        <h2 id="radio-list-heading" className="radio-section__title">قائمة القرّاء</h2>
        <ul className="radio-station-grid">
          {filtered.map((item) => (
            <StationCard
              key={item.id}
              item={item}
              active={stationId === item.id}
              playing={stationId === item.id && playing}
              playerState={stationId === item.id ? playerState : "idle"}
              isFavorite={favorites.includes(item.id)}
              onSelect={() => selectStation(item.id)}
              onToggleFav={() => toggleFav(item.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function StationCard({
  item,
  active,
  playing,
  playerState,
  isFavorite,
  onSelect,
  onToggleFav,
}: {
  item: (typeof QURAN_RADIO_STATIONS)[number];
  active: boolean;
  playing: boolean;
  playerState: string;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
}) {
  return (
    <li>
      <article className={`radio-station-card ui-card${active ? " is-active" : ""}`}>
        <div className="radio-station-card__icon" aria-hidden="true">
          <Icon name="mic" size={20} />
        </div>
        <div className="radio-station-card__body">
          <h3>{item.reciterName}</h3>
          <p>{item.readingType} · {item.quality}</p>
          <span className={`radio-status-badge radio-status-badge--${active ? playerState : "idle"}`}>
            {active ? (STATE_LABELS[playerState] || "—") : "جاهز"}
          </span>
        </div>
        <div className="radio-station-card__actions">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onToggleFav} aria-label="مفضلة">
            <Icon name="heart" size={16} />
          </button>
          <button type="button" className="ds-btn ds-btn--primary" onClick={onSelect}>
            {active && playing ? "إيقاف" : "تشغيل"}
          </button>
        </div>
      </article>
    </li>
  );
}
