import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ShareButtons } from "@/components/ContentActions";
import {
  Radio, Wifi, Volume2, ChevronLeft, Globe, Mic2,
  BookOpen, ExternalLink,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

/* ── قنوات البث المباشر ──────────────────────────────────── */
type LiveChannel = {
  id: string;
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  backupUrl?: string;
  isActive: boolean;
  lang: string;
  flag: string;
};

const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: "makkah",
    name: "قناة مكة المكرمة",
    location: "المسجد الحرام",
    description: "البث المباشر من قلب المسجد الحرام، مكة المكرمة",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCsnvbFLXnfKHNPMsFqrqtew&autoplay=1",
    isActive: true,
    lang: "ar",
    flag: "🕋",
  },
  {
    id: "madinah",
    name: "قناة المدينة المنورة",
    location: "المسجد النبوي",
    description: "البث المباشر من المسجد النبوي الشريف، المدينة المنورة",
    streamUrl: "https://www.youtube.com/embed/live_stream?channel=UC7TRvJiLXGkGXqEO3O9Z9GQ&autoplay=1",
    isActive: true,
    lang: "ar",
    flag: "🕌",
  },
  {
    id: "saudi",
    name: "إذاعة القرآن السعودية",
    location: "المملكة العربية السعودية",
    description: "بث مستمر لأجمل التلاوات من الإذاعة السعودية",
    streamUrl: "https://stream.radiojar.com/0tpy1h0kxtzuv",
    isActive: true,
    lang: "ar",
    flag: "🇸🇦",
  },
  {
    id: "egypt",
    name: "إذاعة القرآن المصرية",
    location: "مصر",
    description: "إذاعة القرآن الكريم من القاهرة",
    streamUrl: "https://www.quranradio.com/",
    isActive: true,
    lang: "ar",
    flag: "🇪🇬",
  },
];

/* ── روابط يوتيوب للمشايخ ─────────────────────────────────── */
const YOUTUBE_CHANNELS = [
  { name: "قناة الحرمين", handle: "@haramainlive", flag: "🕋" },
  { name: "التلفزيون العربي السعودي", handle: "@ArabiaWeather", flag: "🇸🇦" },
  { name: "قناة إسلام ويب", handle: "@islamweb", flag: "🌍" },
  { name: "مصحف المدينة المنورة", handle: "@quranmic", flag: "📖" },
];

/* ── روابط الرزنامة ──────────────────────────────────────── */
const SCHEDULE = [
  { time: "الفجر", name: "صلاة الفجر مباشرة", icon: "🌅" },
  { time: "الظهر", name: "درس بعد الظهر",       icon: "🌤" },
  { time: "العصر", name: "صلاة العصر مباشرة",  icon: "☀" },
  { time: "المغرب", name: "صلاة المغرب مباشرة", icon: "🌇" },
  { time: "العشاء", name: "صلاة العشاء مباشرة", icon: "🌙" },
  { time: "التهجد", name: "قيام الليل (رمضان)", icon: "⭐" },
];

export default function QuranLivePage() {
  const [activeChannel, setActiveChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/quran-live",
      title: "البث المباشر للقرآن الكريم | المجلس العلمي",
      description: "بث مباشر من الحرمين الشريفين والإذاعات القرآنية، مكة والمدينة ٢٤ ساعة",
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "البث المباشر للقرآن الكريم", url: "https://www.majlisilm.com/quran-live", about: { "@type": "Thing", name: "البث المباشر من الحرمين الشريفين" } }],
    });
  }, []);

  return (
    <div className="qlive-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="qlive-hero">
        <div className="qlive-hero__badge">
          <Wifi size={14} className="qlive-hero__badge-icon" />
          <span>مباشر الآن</span>
        </div>
        <h1 className="qlive-hero__title">البث المباشر للقرآن الكريم</h1>
        <p className="qlive-hero__sub">
          استمع وشاهد البث المباشر من الحرمين الشريفين والإذاعات القرآنية العالمية
        </p>
        <nav className="qlive-subnav" aria-label="تنقل البث">
          <Link href="/quran-hub" className="qlive-subnav__link">مركز القرآن</Link>
          <span className="qlive-subnav__sep">›</span>
          <Link href="/quran-radio" className="qlive-subnav__link">الإذاعات</Link>
          <span className="qlive-subnav__sep">›</span>
          <span className="qlive-subnav__current">البث المباشر</span>
        </nav>
      </section>

      {/* ── اختيار القناة ─────────────────────────────────── */}
      <section className="qlive-channels">
        <h2 className="qlive-section-title">
          <Radio size={18} /> اختر القناة
        </h2>
        <div className="qlive-channel-grid" role="tablist" aria-label="اختيار قناة القرآن">
          {LIVE_CHANNELS.map(ch => (
            <button
              key={ch.id}
              role="tab"
              type="button"
              className={["qlive-ch-card", activeChannel.id === ch.id ? "qlive-ch-card--active" : ""].join(" ")}
              onClick={() => { setActiveChannel(ch); setPlaying(true); }}
              aria-selected={activeChannel.id === ch.id}
            >
              <span className="qlive-ch-flag">{ch.flag}</span>
              <div className="qlive-ch-info">
                <span className="qlive-ch-name">{ch.name}</span>
                <span className="qlive-ch-loc">{ch.location}</span>
              </div>
              {ch.isActive && <span className="qlive-ch-live">مباشر</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── مشغّل ─────────────────────────────────────────── */}
      <section className="qlive-player">
        <div className="qlive-player__header">
          <div className="qlive-player__info">
            <span className="qlive-player__flag">{activeChannel.flag}</span>
            <div>
              <h3 className="qlive-player__name">{activeChannel.name}</h3>
              <p className="qlive-player__loc">
                <Globe size={12} /> {activeChannel.location}
              </p>
            </div>
          </div>
          {activeChannel.isActive && (
            <span className="qlive-live-badge">
              <span className="qlive-live-dot" />
              مباشر
            </span>
          )}
        </div>
        <p className="qlive-player__desc">{activeChannel.description}</p>

        {/* مشغّل الصوت. لا <track> ممكن هنا: بث مباشر (live radio stream) بلا
            نهاية زمنية معروفة، لا يمكن توفير ترجمة/تفريغ متزامن لمحتوى حي. */}
        {playing && activeChannel.id !== "makkah" && activeChannel.id !== "madinah" && (
          <div className="qlive-audio-wrap">
            <audio
              key={activeChannel.streamUrl}
              controls
              autoPlay
              className="qlive-audio"
              preload="none"
            >
              <source src={activeChannel.streamUrl} type="audio/mpeg" />
              متصفحك لا يدعم تشغيل الصوت.
            </audio>
          </div>
        )}

        {/* للحرمين، رابط YouTube */}
        {(activeChannel.id === "makkah" || activeChannel.id === "madinah") && (
          <div className="qlive-youtube-notice">
            <BookOpen size={20} />
            <div>
              <p>للمشاهدة المباشرة من الحرمين الشريفين:</p>
              <a
                href={
                  activeChannel.id === "makkah"
                    ? "https://www.youtube.com/@haramainlive"
                    : "https://www.youtube.com/@nabawi_tv"
                }
                target="_blank" rel="noopener noreferrer"
                className="qlive-yt-btn"
              >
                فتح في يوتيوب <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {!playing && (
          <button type="button" className="qlive-play-btn" onClick={() => setPlaying(true)}>
            <Volume2 size={20} /> ابدأ الاستماع
          </button>
        )}
      </section>

      {/* ── قنوات يوتيوب ─────────────────────────────────── */}
      <section className="qlive-yt-section">
        <h2 className="qlive-section-title">
          <Mic2 size={18} /> قنوات يوتيوب موصى بها
        </h2>
        <div className="qlive-yt-grid">
          {YOUTUBE_CHANNELS.map(ch => (
            <div key={ch.handle} className="qlive-yt-card">
              <span className="qlive-yt-flag">{ch.flag}</span>
              <div>
                <p className="qlive-yt-name">{ch.name}</p>
                <p className="qlive-yt-handle">{ch.handle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── البرنامج اليومي ───────────────────────────────── */}
      <section className="qlive-schedule">
        <h2 className="qlive-section-title">
          <Radio size={18} /> جدول البث اليومي من الحرمين
        </h2>
        <div className="qlive-schedule-list">
          {SCHEDULE.map(s => (
            <div key={s.time} className="qlive-schedule-item">
              <span className="qlive-schedule-emoji"><SectionIcon name={s.icon} size={22} /></span>
              <div className="qlive-schedule-info">
                <span className="qlive-schedule-time">{s.time}</span>
                <span className="qlive-schedule-name">{s.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── روابط ذات صلة ─────────────────────────────────── */}
      <div className="twh-share">
        <ShareButtons title="البث المباشر للقرآن الكريم — المجلس العلمي" url="https://www.majlisilm.com/quran-live" />
      </div>
      <div className="px-4 pb-4 mt-4">
        <SectionQuiz categoryId="quran" title="اختبر معلوماتك في القرآن الكريم" count={4} />
      </div>

      <section className="qlive-related">
        <h2 className="qlive-section-title">استكشف أيضاً</h2>
        <div className="qlive-related-links">
          <Link href="/quran-radio" className="qlive-related-link">
            <Radio size={16} /> إذاعات القرآن
            <ChevronLeft size={14} />
          </Link>
          <Link href="/quran-hub" className="qlive-related-link">
            <BookOpen size={16} /> مركز القرآن
            <ChevronLeft size={14} />
          </Link>
          <Link href="/muezzins" className="qlive-related-link">
            <Mic2 size={16} /> مكتبة المؤذنين
            <ChevronLeft size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
