"use client";

import { useEffect } from "react";
import { Link } from "wouter";
import { RADIO_STATIONS, LIVE_CHANNELS, saveLastRadioId } from "@/lib/quran-radio";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import "@/styles/quran.css";

const RADIO_STATE_LABELS = {
  idle: "جاهز",
  connecting: "○ جاري الاتصال…",
  live: "● البث مباشر",
  paused: "○ متوقف",
  error: "✕ تعذّر البث",
} as const;

export default function QuranRadioPage() {
  const radio = useRadioPlayer();
  useEffect(() => {
    if (radio.station) {
      saveLastRadioId(radio.station.id);
    }
  }, [radio.station]);

  return (
    <div className="page-shell qs-radio-page">
      {/* Subnav */}
      <nav className="qs-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="qs-subnav__link">المصحف</Link>
        <Link href="/quran-radio" className="qs-subnav__link is-active">الإذاعة والبث</Link>
      </nav>

      <div style={{ padding: "1.5rem 1rem 8rem", maxWidth: "860px", margin: "0 auto" }}>
        {/* ── Section: Radio streams ── */}
        <section aria-labelledby="radio-heading">
          <div className="ds-section__head" style={{ marginBottom: "1rem" }}>
            <h1 id="radio-heading" className="ds-section__title">إذاعات القرآن الكريم</h1>
          </div>
          <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginBottom: "1rem", direction: "rtl" }}>
            بث مستمر لقرّاء موثوقين — المصدر: qurango.net. كل إذاعة بصوت القارئ المسمّى.
          </p>

          <ol className="qs-radio-list" aria-label="قائمة إذاعات القرآن">
            {RADIO_STATIONS.map((station) => {
              const isActive = radio.station?.id === station.id;
              const stateKey = isActive ? radio.radioState : "idle";
              return (
                <li key={station.id}>
                  <div className={`qs-radio-card${isActive ? " is-active" : ""}`}>
                    <div className="qs-radio-card__info">
                      <span className="qs-radio-card__name">{station.reciterName}</span>
                      <span className="qs-radio-card__type">{station.readingType}</span>
                    </div>
                    <div className="qs-radio-card__actions">
                      <span className={`qs-radio-status${stateKey === "live" ? " qs-radio-status--live" : stateKey === "error" ? " qs-radio-status--error" : ""}`}>
                        {RADIO_STATE_LABELS[stateKey]}
                      </span>
                      <button
                        type="button"
                        className="qs-radio-play-btn"
                        onClick={() => radio.toggle(station)}
                        aria-pressed={isActive && radio.radioState === "live"}
                      >
                        {isActive && radio.radioState === "live" ? "إيقاف" : "تشغيل"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Active station controls */}
          {radio.station && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                background: "var(--bg-card, #fff)",
                border: "1px solid var(--majalis-gold, #B08D2E)",
                borderRadius: ".75rem",
                direction: "rtl",
              }}
              aria-live="polite"
              aria-label="الإذاعة النشطة"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
                <div>
                  <p style={{ fontWeight: "700", marginBottom: ".15rem" }}>{radio.station.reciterName}</p>
                  <p style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>{radio.station.readingType}</p>
                </div>
                <span className={`qs-radio-status${radio.radioState === "live" ? " qs-radio-status--live" : radio.radioState === "error" ? " qs-radio-status--error" : ""}`}>
                  {RADIO_STATE_LABELS[radio.radioState]}
                </span>
              </div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                <button type="button" className="qs-radio-play-btn" onClick={() => radio.station && radio.toggle(radio.station)}>
                  {radio.radioState === "live" ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  type="button"
                  className="qs-pb-btn"
                  onClick={radio.reconnect}
                >
                  إعادة الاتصال
                </button>
                <button type="button" className="qs-pb-btn" onClick={radio.stop}>
                  إيقاف
                </button>
              </div>
              <div className="qs-volume-row">
                <label htmlFor="radio-volume">الصوت</label>
                <input
                  id="radio-volume"
                  type="range"
                  min={0}
                  max={100}
                  value={radio.volume}
                  onChange={(e) => radio.setVolume(Number(e.target.value))}
                />
                <span style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{radio.volume}%</span>
              </div>
              <p className="qs-source-note">المصدر: qurango.net</p>
            </div>
          )}
        </section>

        {/* ── Section: Live HLS channels ── */}
        <section className="qs-live-section" aria-labelledby="live-heading">
          <div className="ds-section__head" style={{ marginBottom: "1rem" }}>
            <h2 id="live-heading" className="ds-section__title">البث المباشر</h2>
          </div>
          <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginBottom: "1rem", direction: "rtl" }}>
            بث مباشر HLS من قنوات رسمية — افتح الرابط في مشغّل الفيديو المدمج أو انسخه لأي مشغّل خارجي.
          </p>

          <div className="qs-live-cards">
            {LIVE_CHANNELS.map((ch) => (
              <div key={ch.id} className="qs-live-card">
                <p className="qs-live-card__name">{ch.name}</p>
                <p className="qs-live-card__desc">{ch.description}</p>
                <video
                  src={ch.streamUrl}
                  controls
                  preload="none"
                  playsInline
                  style={{ width: "100%", borderRadius: ".4rem", maxHeight: "200px", background: "#000" }}
                  aria-label={ch.name}
                />
                <p className="qs-live-card__source">المصدر: {ch.source}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
