/** Official HLS live streams — verified HTTP 200 (2026-06-27). */
export type LiveStreamChannel = {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  poster: string;
  quality: string;
  source: string;
  /** When false, show unavailable message instead of player */
  available: boolean;
  unavailableReason?: string;
};

export const LIVE_STREAM_CHANNELS: LiveStreamChannel[] = [
  {
    id: "makkah-haram",
    name: "قناة القرآن الكريم — الحرم المكي",
    description: "بث مباشر من المسجد الحرام — صلاة وقرآن على مدار الساعة.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8",
    poster: "/images/live/makkah.svg",
    quality: "HD",
    source: "هيئة الإذاعة والتلفزيون — قناة القرآن الكريم",
    available: true,
  },
  {
    id: "madinah-nabawi",
    name: "قناة السنة النبوية — المسجد النبوي",
    description: "بث مباشر من المسجد النبوي الشريف — صلوات وأذكار.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8",
    poster: "/images/live/madinah.svg",
    quality: "HD",
    source: "هيئة الإذاعة والتلفزيون — قناة السنة النبوية",
    available: true,
  },
  {
    id: "ithraa",
    name: "قناة إثراء",
    description: "قناة إثراء الكويت — برامج دينية وثقافية.",
    streamUrl: "https://live.kwikmotion.com/kwktvethraa/kwktvethraa/playlist.m3u8",
    poster: "/images/live/ithraa.svg",
    quality: "HD",
    source: "تلفزيون الكويت — قناة إثراء",
    available: true,
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

export const LIVE_CONNECTION_LABELS = {
  live: { emoji: "🟢", text: "متصل" },
  loading: { emoji: "🟡", text: "جاري الاتصال" },
  paused: { emoji: "🟡", text: "متوقف" },
  idle: { emoji: "🟡", text: "جاهز" },
  error: { emoji: "🔴", text: "غير متصل" },
} as const;

export const RADIO_CONNECTION_LABELS = {
  live: { emoji: "🟢", text: "متصل" },
  connecting: { emoji: "🟡", text: "جاري الاتصال" },
  paused: { emoji: "🟡", text: "متوقف" },
  idle: { emoji: "🟡", text: "جاهز" },
  error: { emoji: "🔴", text: "غير متصل" },
} as const;
