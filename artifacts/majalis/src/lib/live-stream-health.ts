import {
  getChannelStreamUrls,
  getResolvedLiveStreamChannels,
  type LiveStreamChannel,
} from "@/lib/quran-live-streams";

export type LiveStreamHealthStatus = "working" | "broken" | "needs_update";

export type LiveStreamHealthResult = {
  channelId: string;
  url: string;
  status: LiveStreamHealthStatus;
  checkedAt: string;
  detail: string;
};

export type ChannelHealthSummary = {
  channelId: string;
  status: LiveStreamHealthStatus;
  workingUrl: string | null;
  checkedAt: string;
  results: LiveStreamHealthResult[];
};

const CACHE_KEY = "majalis-live-stream-health-v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

type HealthCache = {
  checkedAt: string;
  channels: Record<string, ChannelHealthSummary>;
};

function readCache(): HealthCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HealthCache;
    if (!parsed?.checkedAt || !parsed.channels) return null;
    if (Date.now() - new Date(parsed.checkedAt).getTime() > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(channels: Record<string, ChannelHealthSummary>) {
  try {
    const payload: HealthCache = { checkedAt: new Date().toISOString(), channels };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function isValidHlsBody(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("#EXTM3U") || trimmed.startsWith("#EXT-X-");
}

function classifyResponse(status: number, contentType: string, body: string): LiveStreamHealthStatus {
  if (status < 200 || status >= 400) return "broken";
  const ct = contentType.toLowerCase();
  const looksLikeHls =
    ct.includes("mpegurl") || ct.includes("vnd.apple") || isValidHlsBody(body);
  if (looksLikeHls && isValidHlsBody(body)) return "working";
  if (body.trimStart().startsWith("<!") || body.includes("<html")) return "needs_update";
  return "broken";
}

export async function checkStreamUrl(url: string, channelId: string): Promise<LiveStreamHealthResult> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const body = (await res.text()).slice(0, 2048);
    const contentType = res.headers.get("content-type") ?? "";
    const status = classifyResponse(res.status, contentType, body);
    const detail =
      status === "working"
        ? "بث HLS صالح"
        : status === "needs_update"
          ? "الرابط يُرجع HTML وليس m3u8 — يحتاج تحديث"
          : `HTTP ${res.status} — ليس بث HLS صالح`;
    return { channelId, url, status, checkedAt, detail };
  } catch (err) {
    return {
      channelId,
      url,
      status: "broken",
      checkedAt,
      detail: err instanceof Error ? err.message : "فشل الاتصال",
    };
  }
}

export async function checkChannelHealth(channel: LiveStreamChannel): Promise<ChannelHealthSummary> {
  const urls = getChannelStreamUrls(channel);
  const results: LiveStreamHealthResult[] = [];
  let workingUrl: string | null = null;

  for (const url of urls) {
    const result = await checkStreamUrl(url, channel.id);
    results.push(result);
    if (result.status === "working") {
      workingUrl = url;
      break;
    }
  }

  const status: LiveStreamHealthStatus = workingUrl
    ? "working"
    : results.some((r) => r.status === "needs_update")
      ? "needs_update"
      : "broken";

  return {
    channelId: channel.id,
    status,
    workingUrl,
    checkedAt: new Date().toISOString(),
    results,
  };
}

export async function checkAllLiveStreamHealth(force = false): Promise<Record<string, ChannelHealthSummary>> {
  if (!force) {
    const cached = readCache();
    if (cached) return cached.channels;
  }

  const channels = getResolvedLiveStreamChannels();
  const summaries: Record<string, ChannelHealthSummary> = {};

  await Promise.all(
    channels.map(async (ch) => {
      summaries[ch.id] = await checkChannelHealth(ch);
    }),
  );

  writeCache(summaries);
  return summaries;
}

export function healthStatusLabel(status: LiveStreamHealthStatus): string {
  switch (status) {
    case "working":
      return "تعمل";
    case "needs_update":
      return "تحتاج تحديث رابط";
    default:
      return "لا تعمل";
  }
}
