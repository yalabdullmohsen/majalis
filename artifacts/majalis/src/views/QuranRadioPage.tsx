"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-radio-stations";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useQuranRadioPlayer } from "@/hooks/useQuranRadioPlayer";
import "@/styles/quran-media.css";

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
  connecting: "○ جاري الاتصال…",
  paused: "○ متوقف",
  idle: "○ جاهز",
  error: "✗ تعذّر البث",
};

export default function QuranRadioPage() {
  const [active, setActive] = useState(getLastRadio);
  const { preferences, updatePreferences } = useUserPreferences();
  const station = QURAN_RADIO_STATIONS.find((s) => s.id === active);
  const {
    playing,
    playerState,
    statusMessage,
    nowPlaying,
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
        subtitle="بث مباشر لقرّاء موثوقين — كل إذاعة بصوت القارئ المسمّى."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link is-active">الإذاعات</Link>
      </nav>

      <ol className="quran-radio-list" aria-label="قائمة إذاعات القرآن">
        {QURAN_RADIO_STATIONS.map((item, index) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <article
                className={`quran-radio-card ui-card${isActive ? " is-active" : ""}${isActive && playerState === "error" ? " has-error" : ""}`}
              >
                <div className="quran-radio-card__meta">
                  <span className="quran-radio-card__index">{index + 1}</span>
                  <div className="quran-radio-card__body">
                    <h2 className="quran-radio-card__reciter">{item.reciterName}</h2>
                    <dl className="quran-radio-card__details">
                      <div>
                        <dt>نوع القراءة</dt>
                        <dd>{item.readingType}</dd>
                      </div>
                      <div>
                        <dt>الجودة</dt>
                        <dd>{item.quality}</dd>
                      </div>
                      {isActive && (
                        <div>
                          <dt>السورة الحالية</dt>
                          <dd>{nowPlaying || "—"}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                <div className="quran-radio-card__actions">
                  <span
                    className={`quran-radio-card__status quran-radio-card__status--${isActive ? playerState : "idle"}`}
                    aria-live="polite"
                  >
                    {isActive ? STATE_LABELS[playerState] || statusMessage : "جاهز"}
                  </span>
                  <button
                    type="button"
                    className="lesson-unified-card__btn lesson-unified-card__btn--primary"
                    onClick={() => selectStation(item.id)}
                    aria-pressed={isActive && playing}
                  >
                    {isActive && playing ? "إيقاف" : "تشغيل"}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {station && (
        <div className={`quran-radio-player ui-card${playerState === "error" ? " quran-radio-player--error" : ""}`} aria-live="polite">
          <div className="quran-radio-player__header">
            <div>
              <p className="quran-radio-player__label">الإذاعة النشطة</p>
              <p className="quran-radio-player__reciter">{station.reciterName}</p>
              <p className="quran-radio-player__type">{station.readingType} · {station.quality}</p>
            </div>
            <span className={`radio-live-badge radio-live-badge--${playerState}`}>
              {STATE_LABELS[playerState] || statusMessage}
            </span>
          </div>

          {statusMessage && playerState === "error" && (
            <p className="quran-radio-player__error" role="alert">{statusMessage}</p>
          )}
          {statusMessage && playerState !== "error" && (
            <p className="quran-radio-player__status">{statusMessage}</p>
          )}

          <div className="quran-radio-player__controls">
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
          <p className="settings-note">يُفضّل ضبط الصوت من الإعدادات العامة أيضاً.</p>
        </div>
      )}
    </div>
  );
}
