"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  LIVE_STREAM_CHANNELS,
  getChannelById,
  getLiveAutoplayPreference,
  saveLiveAutoplayPreference,
} from "@/lib/quran-live-streams";

export default function QuranLivePage() {
  const [activeId, setActiveId] = useState(LIVE_STREAM_CHANNELS[0]?.id || "");
  const [autoplay, setAutoplay] = useState(getLiveAutoplayPreference);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");
  const [useFallback, setUseFallback] = useState(false);
  const mediaRef = useRef<HTMLAudioElement>(null);

  const channel = getChannelById(activeId);

  useEffect(() => {
    saveLiveAutoplayPreference(autoplay);
  }, [autoplay]);

  useEffect(() => {
    setUseFallback(false);
    setStatus("loading");
    const media = mediaRef.current;
    if (!media || !channel) return;

    const url = useFallback && channel.fallbackUrl ? channel.fallbackUrl : channel.streamUrl;
    media.src = url;
    media.load();
    if (autoplay) {
      media.play().catch(() => setStatus("error"));
    }

    const onPlaying = () => setStatus("live");
    const onError = () => {
      if (!useFallback && channel.fallbackUrl) {
        setUseFallback(true);
      } else {
        setStatus("error");
      }
    };
    media.addEventListener("playing", onPlaying);
    media.addEventListener("error", onError);
    return () => {
      media.removeEventListener("playing", onPlaying);
      media.removeEventListener("error", onError);
    };
  }, [activeId, autoplay, channel, useFallback]);

  const toggleFullscreen = () => {
    const el = document.querySelector(".live-player-wrap");
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };

  return (
    <div className="page-shell live-page">
      <PageHeader eyebrow="البث" title="البث المباشر" subtitle="قنوات قرآنية وحرمين شريفين — بث مباشر." />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص السور</Link>
        <Link href="/quran-live" className="quran-subnav__link is-active">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      </nav>

      <div className="live-grid">
        {LIVE_STREAM_CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={`live-card ui-card${activeId === ch.id ? " is-active" : ""}`}
            onClick={() => setActiveId(ch.id)}
          >
            <span className={`live-status live-status--${ch.status}`}>
              {activeId === ch.id && status === "live" ? "● مباشر" : ch.status === "live" ? "●" : "○"}
            </span>
            <strong>{ch.name}</strong>
            <p>{ch.description}</p>
            <span className="live-quality">{ch.quality}</span>
          </button>
        ))}
      </div>

      {channel && (
        <div className="live-player-wrap ui-card">
          <div className="live-player-head">
            <div>
              <h2>{channel.name}</h2>
              <p>{channel.description}</p>
            </div>
            <div className="live-player-controls">
              <label className="settings-toggle-row">
                <span>تشغيل تلقائي</span>
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                />
              </label>
              <button type="button" className="ui-card-btn" onClick={toggleFullscreen}>
                ملء الشاشة
              </button>
            </div>
          </div>

          <div className="live-player-visual" aria-hidden="true">
            {channel.poster && <img src={channel.poster} alt="" className="live-poster" />}
            <span className={`live-badge live-badge--${status}`}>
              {status === "live" ? "بث مباشر" : status === "loading" ? "جاري الاتصال..." : "تعذر الاتصال — جرّب البديل"}
            </span>
          </div>

          <audio ref={mediaRef} controls className="live-audio" />
          <p className="quran-source-note">المصدر: {channel.source}{useFallback ? " (بث بديل)" : ""}</p>
        </div>
      )}
    </div>
  );
}
