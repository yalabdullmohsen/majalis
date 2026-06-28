/** Official HLS live streams — verified HTTP 200 + valid #EXTM3U (2026-06-28). */
export type LiveStreamChannel = {
  id: string;
  name: string;
  description: string;
  /** Primary HLS manifest URL */
  streamUrl: string;
  /** Ordered fallback URLs tried when primary fails */
  fallbackUrls?: string[];
  poster: string;
  quality: string;
  source: string;
};

export const LIVE_STREAM_CHANNELS: LiveStreamChannel[] = [
  {
    id: "makkah-haram",
    name: "بث الحرم المكي",
    description: "بث مباشر من المسجد الحرام — صلاة وقرآن على مدار الساعة.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8",
    fallbackUrls: [
      "https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/saudi_quran.m3u8",
    ],
    poster: "/images/live/makkah.svg",
    quality: "HD",
    source: "هيئة الإذاعة والتلفزيون — قناة القرآن الكريم",
  },
  {
    id: "madinah-nabawi",
    name: "بث المسجد النبوي",
    description: "بث مباشر من المسجد النبوي الشريف — صلوات وأذكار.",
    streamUrl: "https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8",
    fallbackUrls: [
      "https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/saudi_sunnah.m3u8",
    ],
    poster: "/images/live/madinah.svg",
    quality: "HD",
    source: "هيئة الإذاعة والتلفزيون — قناة السنة النبوية",
  },
  {
    id: "ithraa",
    name: "قناة إثراء",
    description: "قناة إثراء الكويت — برامج دينية وثقافية.",
    streamUrl: "https://kwtethta.cdn.mangomolo.com/eth/smil:eth.stream.smil/chunklist.m3u8",
    fallbackUrls: [
      "https://kwtethta.cdn.mangomolo.com/eth/smil:eth.stream.smil/master.m3u8",
    ],
    poster: "/images/live/ithraa.svg",
    quality: "HD",
    source: "تلفزيون الكويت — قناة إثراء",
  },
];

const ADMIN_OVERRIDES_KEY = "majalis-live-streams-admin-v1";
const AUTOPLAY_KEY = "majalis-live-autoplay-v1";

export type LiveStreamAdminOverride = {
  streamUrl?: string;
  fallbackUrls?: string[];
};

export function getLiveStreamAdminOverrides(): Record<string, LiveStreamAdminOverride> {
  try {
    const raw = localStorage.getItem(ADMIN_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LiveStreamAdminOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLiveStreamAdminOverride(channelId: string, override: LiveStreamAdminOverride) {
  const all = getLiveStreamAdminOverrides();
  all[channelId] = { ...all[channelId], ...override };
  localStorage.setItem(ADMIN_OVERRIDES_KEY, JSON.stringify(all));
}

/** Resolve channel with optional admin URL overrides. */
export function resolveChannel(channel: LiveStreamChannel): LiveStreamChannel {
  const override = getLiveStreamAdminOverrides()[channel.id];
  if (!override) return channel;
  return {
    ...channel,
    streamUrl: override.streamUrl?.trim() || channel.streamUrl,
    fallbackUrls: override.fallbackUrls?.length ? override.fallbackUrls : channel.fallbackUrls,
  };
}

export function getResolvedLiveStreamChannels(): LiveStreamChannel[] {
  return LIVE_STREAM_CHANNELS.map(resolveChannel);
}

/** All unique stream URLs for a channel (primary first, then fallbacks). */
export function getChannelStreamUrls(channel: LiveStreamChannel): string[] {
  const resolved = resolveChannel(channel);
  const urls = [resolved.streamUrl, ...(resolved.fallbackUrls ?? [])].filter(Boolean);
  return [...new Set(urls)];
}

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
  const base = LIVE_STREAM_CHANNELS.find((c) => c.id === id);
  return base ? resolveChannel(base) : undefined;
}
