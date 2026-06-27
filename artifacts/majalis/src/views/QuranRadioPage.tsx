"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-content";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useQuranRadioPlayer } from "@/hooks/useQuranRadioPlayer";

const LAST_RADIO_KEY = "majalis-last-radio-v1";

function getLastRadio(): string {
  try {
    return localStorage.getItem(LAST_RADIO_KEY) || QURAN_RADIO_STATIONS[0]?.id || "";
  } catch {
    return QURAN_RADIO_STATIONS[0]?.id || "";
  }
}

const STATE_LABELS: Record<string, string> = {
  live: "● البث مباشر",
  fallback: "● متصل (احتياطي)",
  connecting: "○ جاري الاتصال…",
  paused: "○ متوقف",
  idle: "○ جاهز",
};

export default function QuranRadioPage() {
  const [active, setActive] = useState(getLastRadio);
  const { preferences, updatePreferences } = useUserPreferences();
  const station = QURAN_RADIO_STATIONS.find((s) => s.id === active);
  const {
    playing,
    playerState,
    statusMessage,
    activeQuality,
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
    <div className="page-shell quran-radio-page">
      <PageHeader
        eyebrow="القرآن"
        title="إذاعات القرآن الكريم"
        subtitle="بث مباشر HTTPS لإذاعات قرآنية موثوقة — مع رابط احتياطي تلقائي."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link is-active">الإذاعات</Link>
      </nav>

      <div className="radio-grid">
        {QURAN_RADIO_STATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`radio-card ui-card${active === item.id ? " is-active" : ""}`}
            onClick={() => selectStation(item.id)}
            aria-pressed={active === item.id && playing}
          >
            <strong>{item.name}</strong>
            <span>{item.quality}</span>
            {item.reciter && <span>{item.reciter}</span>}
            {item.country && <span>{item.country}</span>}
            <span className="radio-card__status">
              {active === item.id && playing ? "● يعمل" : "تشغيل"}
            </span>
          </button>
        ))}
      </div>

      {station && (
        <div className="radio-player ui-card" aria-live="polite">
          <div className="radio-player__header">
            <div>
              <p className="radio-player__name"><strong>{station.name}</strong></p>
              {station.reciter && <p className="settings-note">القارئ: {station.reciter}</p>}
            </div>
            <span className={`radio-live-badge radio-live-badge--${playerState}`}>
              {STATE_LABELS[playerState] || STATE_LABELS.idle}
            </span>
          </div>

          <p className="settings-note">جودة البث: {activeQuality}</p>
          {statusMessage && <p className="radio-player__status">{statusMessage}</p>}

          <div className="radio-player__controls">
            <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--primary" onClick={toggle}>
              {playing ? "إيقاف" : "تشغيل"}
            </button>
            <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={reconnect}>
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
