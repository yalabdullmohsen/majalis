export type LiveStreamChannel = {
  id: string;
  name: string;
  description: string;
  category: "quran" | "sunnah" | "makkah" | "madinah";
  streamUrl: string;
  fallbackUrl?: string;
  poster?: string;
  quality: string;
  status: "live" | "unknown";
  source: string;
};

/**
 * Public HLS/audio streams — may require network access.
 * Fallback URLs provided where official streams change.
 */
export const LIVE_STREAM_CHANNELS: LiveStreamChannel[] = [
  {
    id: "quran-tv",
    name: "قناة القرآن الكريم",
    description: "بث مباشر لتلاوات وبرامج قرآنية.",
    category: "quran",
    streamUrl: "https://win.holymakkah.net/servlet/WebMEDIA?media=quran",
    fallbackUrl: "https://stream.radiojar.com/8s5u5tadnceuv",
    quality: "متوسط",
    status: "live",
    source: "مصادر بث عامة",
  },
  {
    id: "sunnah-tv",
    name: "قناة السنة النبوية",
    description: "برامج ودروس في السنة النبوية.",
    category: "sunnah",
    streamUrl: "https://stream.radiojar.com/4wqre23fku0uv",
    quality: "128 kbps",
    status: "live",
    source: "إذاعة السعودية — بث عام",
  },
  {
    id: "makkah-live",
    name: "قناة المسجد الحرام",
    description: "بث مباشر من المسجد الحرام — صلاة وتراويح.",
    category: "makkah",
    streamUrl: "https://win.holymakkah.net/servlet/WebMEDIA?media=makkah",
    fallbackUrl: "https://stream.radiojar.com/8s5u5tadnceuv",
    poster: "/logo.png",
    quality: "HD",
    status: "live",
    source: "Holymakkah — بث عام",
  },
  {
    id: "madinah-live",
    name: "قناة المسجد النبوي",
    description: "بث مباشر من المسجد النبوي الشريف.",
    category: "madinah",
    streamUrl: "https://win.holymakkah.net/servlet/WebMEDIA?media=madinah",
    fallbackUrl: "https://stream.radiojar.com/4wqre23fku0uv",
    poster: "/logo.png",
    quality: "HD",
    status: "live",
    source: "Holymakkah — بث عام",
  },
];

const AUTOPLAY_KEY = "majalis-live-autoplay-v1";

export function getLiveAutoplayPreference(): boolean {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveLiveAutoplayPreference(enabled: boolean) {
  try {
    localStorage.setItem(AUTOPLAY_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getChannelById(id: string): LiveStreamChannel | undefined {
  return LIVE_STREAM_CHANNELS.find((c) => c.id === id);
}
