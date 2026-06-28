"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { QuranPagesSubnav } from "@/components/quran/QuranPagesSubnav";
import {
  QURAN_RADIO_STATIONS,
  getRadioDisplayLabel,
} from "@/lib/quran-radio-stations";
import { RADIO_CONNECTION_LABELS } from "@/lib/quran-live-streams";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useQuranRadioPlayer } from "@/hooks/useQuranRadioPlayer";
import "@/styles/quran-pages.css";

const LAST_RADIO_KEY = "majalis-last-radio-v1";

function getLastRadio(): string {
  try {
    return localStorage.getItem(LAST_RADIO_KEY) || QURAN_RADIO_STATIONS[0]?.id || "";
  } catch {
    return QURAN_RADIO_STATIONS[0]?.id || "";
  }
}

function RadioSkeleton() {
  return (
    <div className="quran-radio-skeleton" aria-hidden="true">
      <div className="quran-radio-skeleton__circle" />
      <div style={{ flex: 1 }}>
        <div className="quran-radio-skeleton__bar" style={{ width: "60%", marginBottom: "0.5rem" }} />
        <div className="quran-radio-skeleton__bar" style={{ width: "40%" }} />
      </div>
    </div>
  );
}

export default function QuranRadioPage() {
  const [active, setActive] = useState(getLastRadio);
  const { preferences, updatePreferences } = useUserPreferences();
  const station = QURAN_RADIO_STATIONS.find((s) => s.id === active);
  const {
    playing,
    playerState,
    statusMessage,
    isLoading,
    toggle,
    reconnect,
    pause,
    play,
  } = useQuranRadioPlayer(station, { volume: Number(preferences.radioVolume) });

  useEffect(() => {
    try {
      localStorage.setItem(LAST_RADIO_KEY, active);
    } catch {
      /* ignore */
    }
  }, [active]);

  const connection = RADIO_CONNECTION_LABELS[playerState] || RADIO_CONNECTION_LABELS.idle;

  const selectStation = (id: string) => {
    if (active === id && playing) {
      pause();
      return;
    }
    setActive(id);
    if (active !== id) {
      setTimeout(play, 80);
    } else {
      play();
    }
  };

  return (
    <div className="page-shell quran-radio-page quran-pages">
      <PageHeader
        eyebrow="القرآن"
        title="إذاعات القرآن الكريم"
        subtitle="بث قرآن مخصص لكل قارئ — لا نعرض اسم قارئ إلا عند التأكد من مصدر البث."
      />

      <QuranPagesSubnav active="radio" />

      {isLoading && station && <RadioSkeleton />}

      <ol className="quran-radio-grid" aria-label="قائمة إذاعات القرآن">
        {QURAN_RADIO_STATIONS.map((item) => {
          const isActive = active === item.id;
          const state = isActive ? playerState : "idle";
          const conn = RADIO_CONNECTION_LABELS[state];
          const displayLabel = getRadioDisplayLabel(item);

          return (
            <li key={item.id}>
              <article
                className={`quran-radio-station-card${isActive ? " is-active" : ""}${isActive && playerState === "error" ? " has-error" : ""}`}
              >
                <img
                  src={item.logo}
                  alt=""
                  className="quran-radio-station-card__logo"
                  width={56}
                  height={56}
                  loading="lazy"
                />
                <div className="quran-radio-station-card__body">
                  <h2 className="quran-radio-station-card__name">{item.stationName}</h2>
                  <p className="quran-radio-station-card__reciter">
                    {item.reciterKnown ? displayLabel : "بث مباشر"}
                    {item.reciterKnown && item.readingStyle ? ` · ${item.readingStyle}` : ""}
                  </p>
                  <ul className="quran-radio-station-card__details">
                    <li>{item.country}</li>
                    <li>{item.streamType}</li>
                    <li>{item.quality}</li>
                  </ul>
                </div>
                <div className="quran-radio-station-card__actions">
                  <span className="quran-radio-station-card__status" aria-live="polite">
                    {conn.emoji} {isActive ? conn.text : "جاهز"}
                  </span>
                  <div className="quran-radio-station-card__btns">
                    <button
                      type="button"
                      className="quran-media-btn quran-media-btn--primary"
                      onClick={() => selectStation(item.id)}
                      aria-pressed={isActive && playing}
                    >
                      {isActive && playing ? "إيقاف" : "تشغيل"}
                    </button>
                    {isActive && (
                      <button
                        type="button"
                        className="quran-media-btn quran-media-btn--secondary"
                        onClick={reconnect}
                      >
                        إعادة الاتصال
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {station && (
        <div
          className={`quran-radio-player-panel${playerState === "error" ? " has-error" : ""}`}
          aria-live="polite"
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "var(--majalis-ink-soft)" }}>
                الإذاعة النشطة
              </p>
              <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--majalis-emerald-deep)" }}>
                {station.stationName}
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--majalis-ink-soft)" }}>
                {station.reciterKnown ? getRadioDisplayLabel(station) : "بث مباشر"}
                {" · "}{station.readingStyle} · {station.quality}
              </p>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>
              {connection.emoji} {connection.text}
            </span>
          </div>

          {statusMessage && playerState === "error" && (
            <p role="alert" style={{ margin: "0 0 1rem", padding: "0.75rem", borderRadius: "0.5rem", background: "#fef2f2", color: "#991b1b", fontWeight: 600 }}>
              {statusMessage}
            </p>
          )}

          <div className="quran-radio-station-card__btns" style={{ marginBottom: "1rem" }}>
            <button type="button" className="quran-media-btn quran-media-btn--primary" onClick={toggle}>
              {playing ? "إيقاف" : "تشغيل"}
            </button>
            <button type="button" className="quran-media-btn quran-media-btn--secondary" onClick={reconnect}>
              إعادة الاتصال
            </button>
          </div>

          <label className="settings-field">
            <span>مستوى الصوت</span>
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.radioVolume}
              onChange={(e) => updatePreferences({ radioVolume: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
