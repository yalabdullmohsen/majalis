import { useEffect } from "react";
import { Link } from "wouter";
import { RADIO_STATIONS, LIVE_CHANNELS, saveLastRadioId } from "@/lib/quran-radio";
import { applyPageSeo } from "@/lib/seo";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import { ShareButtons } from "@/components/ContentActions";
import "@/styles/quran.css";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

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
    applyPageSeo({
      path: "/quran-radio",
      title: "راديو القرآن الكريم | المجلس العلمي",
      description: "استمع إلى القرآن الكريم عبر الإنترنت، محطات إذاعية متنوعة وبث مباشر للتلاوات القرآنية.",
      keywords: ["راديو قرآن", "بث قرآن", "تلاوة قرآنية", "استماع قرآن", "إذاعة إسلامية"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "راديو القرآن الكريم", url: "https://majlisilm.com/quran-radio", about: { "@type": "Thing", name: "إذاعات وبث القرآن الكريم" } }],
    });
  }, []);
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

      <div className="qrp-content">
        {/* ── Section: Radio streams ── */}
        <section aria-labelledby="radio-heading">
          <div className="ds-section__head qrp-section-head">
            <h1 id="radio-heading" className="ds-section__title">إذاعات القرآن الكريم</h1>
          </div>
          <p className="qrp-intro">
            بث مستمر لقرّاء موثوقين، المصدر: qurango.net. كل إذاعة بصوت القارئ المسمّى.
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
            <div className="qrp-now-playing" aria-live="polite" aria-label="الإذاعة النشطة">
              <div className="qrp-now-playing__head">
                <div>
                  <p className="qrp-now-playing__name">{radio.station.reciterName}</p>
                  <p className="qrp-now-playing__type">{radio.station.readingType}</p>
                </div>
                <span className={`qs-radio-status${radio.radioState === "live" ? " qs-radio-status--live" : radio.radioState === "error" ? " qs-radio-status--error" : ""}`}>
                  {RADIO_STATE_LABELS[radio.radioState]}
                </span>
              </div>
              <div className="qrp-now-playing__btns">
                <button type="button" className="qs-radio-play-btn" onClick={() => radio.station && radio.toggle(radio.station)}>
                  {radio.radioState === "live" ? "إيقاف" : "تشغيل"}
                </button>
                <button type="button" className="qs-pb-btn" onClick={radio.reconnect}>
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
                <span className="qrp-volume-pct">{radio.volume}%</span>
              </div>
              <p className="qs-source-note">المصدر: qurango.net</p>
            </div>
          )}
        </section>

        {/* ── Section: Live HLS channels ── */}
        <section className="qs-live-section" aria-labelledby="live-heading">
          <div className="ds-section__head qrp-section-head">
            <h2 id="live-heading" className="ds-section__title">البث المباشر</h2>
          </div>
          <p className="qrp-intro">
            بث مباشر HLS من قنوات رسمية، افتح الرابط في مشغّل الفيديو المدمج أو انسخه لأي مشغّل خارجي.
          </p>

          <div className="qs-live-cards">
            {LIVE_CHANNELS.map((ch) => (
              <div key={ch.id} className="qs-live-card">
                <p className="qs-live-card__name">{ch.name}</p>
                <p className="qs-live-card__desc">{ch.description}</p>
                {ch.youtubeUrl && (
                  <a
                    href={ch.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="qs-youtube-btn"
                    aria-label={`مشاهدة ${ch.name} على يوتيوب`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                    </svg>
                    مشاهدة مباشر على يوتيوب
                  </a>
                )}
                <video
                  src={ch.streamUrl}
                  controls
                  preload="none"
                  playsInline
                  className="qrp-video"
                  aria-label={ch.name}
                />
                <p className="qs-live-card__source">المصدر: {ch.source}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="twh-share">
          <ShareButtons title="إذاعات وقنوات القرآن الكريم — المجلس العلمي" url="https://majlisilm.com/quran-radio" />
        </div>
        <div className="px-4 pb-6 mt-4">
          <SectionQuiz categoryId="quran" title="اختبر معلوماتك في القرآن الكريم" count={4} />
        </div>
      </div>
    </div>
  );
}
