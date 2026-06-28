"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { QuranPagesSubnav } from "@/components/quran/QuranPagesSubnav";
import {
  LIVE_STREAM_CHANNELS,
  LIVE_CONNECTION_LABELS,
  getChannelById,
  getLiveAutoplayPreference,
  saveLiveAutoplayPreference,
} from "@/lib/quran-live-streams";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import "@/styles/quran-pages.css";

function formatUpdated(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

export default function QuranLivePage() {
  const [activeId, setActiveId] = useState(LIVE_STREAM_CHANNELS[0]?.id || "");
  const [autoplay, setAutoplay] = useState(getLiveAutoplayPreference);
  const channel = getChannelById(activeId);
  const streamAvailable = channel?.available !== false;

  const { videoRef, state, errorMessage, lastUpdated, toggle, reload, play, enterFullscreen } = useHlsPlayer({
    streamUrl: streamAvailable ? channel?.streamUrl : undefined,
    autoplay,
  });

  useEffect(() => {
    saveLiveAutoplayPreference(autoplay);
  }, [autoplay]);

  const connection = LIVE_CONNECTION_LABELS[state] || LIVE_CONNECTION_LABELS.idle;

  return (
    <div className="page-shell quran-live-page quran-pages">
      <PageHeader
        eyebrow="البث"
        title="البث المباشر"
        subtitle="بث الحرم المكي والمسجد النبوي — مصادر رسمية من هيئة الإذاعة والتلفزيون."
      />

      <QuranPagesSubnav active="live" />

      <ul className="quran-live-grid" aria-label="قنوات البث المباشر">
        {LIVE_STREAM_CHANNELS.map((ch) => {
          const isActive = activeId === ch.id;
          return (
            <li key={ch.id}>
              <button
                type="button"
                className={`quran-live-channel-card${isActive ? " is-active" : ""}`}
                onClick={() => setActiveId(ch.id)}
                aria-pressed={isActive}
              >
                <img
                  src={ch.poster}
                  alt=""
                  className="quran-live-channel-card__poster"
                  width={56}
                  height={56}
                  loading="lazy"
                />
                <div>
                  <strong className="quran-live-channel-card__title">{ch.name}</strong>
                  <p className="quran-live-channel-card__desc">{ch.description}</p>
                </div>
                <span className="quran-live-channel-card__badge" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  {isActive ? `${connection.emoji} ${connection.text}` : ch.quality}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {channel && (
        <section className="quran-live-player-panel" aria-label={`مشغّل ${channel.name}`}>
          <header className="quran-live-player-panel__head">
            <div className="quran-live-player-panel__info">
              <img src={channel.poster} alt="" width={56} height={56} style={{ borderRadius: "0.65rem" }} loading="lazy" />
              <div>
                <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.125rem", fontWeight: 800, color: "var(--majalis-emerald-deep)" }}>
                  {channel.name}
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--majalis-ink-soft)", lineHeight: 1.55 }}>
                  {channel.description}
                </p>
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {connection.emoji} {connection.text}
            </span>
          </header>

          <dl className="quran-live-player-panel__meta">
            <div><dt style={{ display: "inline" }}>الجودة: </dt><dd style={{ display: "inline", margin: 0 }}>{channel.quality}</dd></div>
            <div><dt style={{ display: "inline" }}>آخر تحديث: </dt><dd style={{ display: "inline", margin: 0 }}>{formatUpdated(lastUpdated)}</dd></div>
            <div><dt style={{ display: "inline" }}>المصدر: </dt><dd style={{ display: "inline", margin: 0 }}>{channel.source}</dd></div>
          </dl>

          {!streamAvailable ? (
            <div className="quran-live-unavailable" role="status">
              <p className="quran-live-unavailable__title">البث غير متاح مؤقتًا</p>
              <p className="quran-live-unavailable__text">
                {channel.unavailableReason || "تعذّر الاتصال بالمصدر الرسمي. جرّب لاحقاً أو اختر قناة أخرى."}
              </p>
            </div>
          ) : state === "error" ? (
            <div className="quran-live-unavailable" role="alert">
              <p className="quran-live-unavailable__title">البث غير متاح مؤقتًا</p>
              <p className="quran-live-unavailable__text">{errorMessage}</p>
              <button
                type="button"
                className="quran-media-btn quran-media-btn--primary"
                style={{ marginTop: "1rem" }}
                onClick={reload}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="quran-live-video-wrap">
              <video
                ref={videoRef}
                className="quran-live-video-wrap__video"
                controls
                playsInline
                crossOrigin="anonymous"
                poster={channel.poster}
                aria-label={channel.name}
              />
              {state === "loading" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  🟡 جاري الاتصال…
                </div>
              )}
            </div>
          )}

          {streamAvailable && state !== "error" && (
            <div className="quran-live-controls">
              <button type="button" className="quran-media-btn quran-media-btn--primary" onClick={toggle}>
                {state === "live" ? "إيقاف" : "تشغيل"}
              </button>
              <button type="button" className="quran-media-btn quran-media-btn--secondary" onClick={reload}>
                إعادة الاتصال
              </button>
              <button type="button" className="quran-media-btn quran-media-btn--secondary" onClick={enterFullscreen}>
                ملء الشاشة
              </button>
              <label className="quran-live-controls__autoplay">
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
          )}

          <p className="quran-source-note">المصدر الرسمي: {channel.source}</p>
        </section>
      )}
    </div>
  );
}
