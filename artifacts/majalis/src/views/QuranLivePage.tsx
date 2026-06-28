"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  LIVE_STREAM_CHANNELS,
  getChannelById,
  getLiveAutoplayPreference,
  saveLiveAutoplayPreference,
} from "@/lib/quran-live-streams";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import "@/styles/quran-media.css";

const STATUS_LABELS = {
  loading: "جاري الاتصال…",
  live: "● بث مباشر",
  paused: "○ متوقف",
  idle: "○ جاهز",
  error: "✗ تعذّر البث",
} as const;

export default function QuranLivePage() {
  const [activeId, setActiveId] = useState(LIVE_STREAM_CHANNELS[0]?.id || "");
  const [autoplay, setAutoplay] = useState(getLiveAutoplayPreference);
  const channel = getChannelById(activeId);
  const { videoRef, state, errorMessage, toggle, reload, play } = useHlsPlayer({
    streamUrl: channel?.streamUrl,
    autoplay,
  });

  useEffect(() => {
    saveLiveAutoplayPreference(autoplay);
  }, [autoplay]);

  const selectChannel = (id: string) => {
    setActiveId(id);
  };

  return (
    <div className="page-shell quran-live-page">
      <PageHeader
        eyebrow="البث"
        title="البث المباشر"
        subtitle="بث الحرم المكي والمسجد النبوي وقناة إثراء — مصادر رسمية."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live" className="quran-subnav__link is-active">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      </nav>

      <ul className="quran-live-grid" aria-label="قنوات البث المباشر">
        {LIVE_STREAM_CHANNELS.map((ch) => {
          const isActive = activeId === ch.id;
          return (
            <li key={ch.id}>
              <button
                type="button"
                className={`quran-live-card ui-card${isActive ? " is-active" : ""}`}
                onClick={() => selectChannel(ch.id)}
                aria-pressed={isActive}
              >
                <img src={ch.poster} alt="" className="quran-live-card__icon" width={56} height={56} />
                <div className="quran-live-card__body">
                  <strong className="quran-live-card__title">{ch.name}</strong>
                  <p className="quran-live-card__desc">{ch.description}</p>
                  <span className="quran-live-card__quality">{ch.quality}</span>
                </div>
                <span className={`quran-live-card__badge${isActive && state === "live" ? " is-live" : ""}`}>
                  {isActive ? STATUS_LABELS[state] : "اختيار"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {channel && (
        <section className="quran-live-player ui-card" aria-label={`مشغّل ${channel.name}`}>
          <header className="quran-live-player__head">
            <div className="quran-live-player__titles">
              <img src={channel.poster} alt="" className="quran-live-player__icon" width={48} height={48} />
              <div>
                <h2 className="quran-live-player__title">{channel.name}</h2>
                <p className="quran-live-player__desc">{channel.description}</p>
              </div>
            </div>
            <span className={`quran-live-player__status quran-live-player__status--${state}`}>
              {STATUS_LABELS[state]}
            </span>
          </header>

          <div className="quran-live-player__video-wrap">
            <video
              ref={videoRef}
              className="quran-live-player__video"
              controls
              playsInline
              poster={channel.poster}
              aria-label={channel.name}
            />
          </div>

          {state === "error" && (
            <div className="quran-live-player__error" role="alert">
              <p>{errorMessage}</p>
              <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--primary" onClick={reload}>
                إعادة المحاولة
              </button>
            </div>
          )}

          <div className="quran-live-player__controls">
            <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--primary" onClick={toggle}>
              {state === "live" ? "إيقاف" : "تشغيل"}
            </button>
            <button type="button" className="lesson-unified-card__btn lesson-unified-card__btn--secondary" onClick={reload}>
              إعادة الاتصال
            </button>
            <label className="settings-toggle-row quran-live-player__autoplay">
              <span>تشغيل تلقائي</span>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => {
                  setAutoplay(e.target.checked);
                  if (e.target.checked) void play();
                }}
              />
            </label>
          </div>

          <p className="quran-source-note">المصدر: {channel.source}</p>
        </section>
      )}
    </div>
  );
}
