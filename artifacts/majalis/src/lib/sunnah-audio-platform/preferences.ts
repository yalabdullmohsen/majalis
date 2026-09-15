/**
 * تفضيلات منصة الصوت — محلية، بلا أسرار.
 */
import type { PrayerVoiceKey, StreamQuality, SunnahAudioPreferences } from "./types";
import { listSelectableAdhanVoices } from "./adhan-catalog";
import { listMurattalReciters } from "./quran-murattal-catalog";

const STORE_KEY = "sunnah.audio.platform.prefs.v1";
const PRAYERS: readonly PrayerVoiceKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function defaultVoiceId(): string {
  return listSelectableAdhanVoices()[0]?.id ?? "short-takbeerat";
}

function defaultReciterId(): string {
  return listMurattalReciters()[0]?.id ?? "husary-murattal";
}

export function defaultSunnahAudioPreferences(): SunnahAudioPreferences {
  const voice = defaultVoiceId();
  return {
    schemaVersion: 1,
    defaultAdhanVoiceId: voice,
    adhanVoiceByPrayer: { fajr: voice, dhuhr: voice, asr: voice, maghrib: voice, isha: voice },
    defaultMurattalReciterId: defaultReciterId(),
    streamQuality: "medium",
    offlineDownloadsEnabled: false,
    updatedAt: new Date(0).toISOString(),
  };
}

function clampQuality(v: unknown): StreamQuality {
  if (v === "high" || v === "medium" || v === "data_saver") return v;
  return "medium";
}

export function normalizeSunnahAudioPreferences(
  raw: Partial<SunnahAudioPreferences> | null | undefined,
): SunnahAudioPreferences {
  const base = defaultSunnahAudioPreferences();
  if (!raw || typeof raw !== "object") return base;
  const voices = { ...base.adhanVoiceByPrayer };
  for (const key of PRAYERS) {
    const v = raw.adhanVoiceByPrayer?.[key];
    voices[key] = typeof v === "string" && v.trim() ? v.trim() : base.adhanVoiceByPrayer[key];
  }
  return {
    schemaVersion: 1,
    defaultAdhanVoiceId:
      typeof raw.defaultAdhanVoiceId === "string" && raw.defaultAdhanVoiceId.trim()
        ? raw.defaultAdhanVoiceId.trim()
        : base.defaultAdhanVoiceId,
    adhanVoiceByPrayer: voices,
    defaultMurattalReciterId:
      typeof raw.defaultMurattalReciterId === "string" && raw.defaultMurattalReciterId.trim()
        ? raw.defaultMurattalReciterId.trim()
        : base.defaultMurattalReciterId,
    streamQuality: clampQuality(raw.streamQuality),
    offlineDownloadsEnabled: Boolean(raw.offlineDownloadsEnabled),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function loadSunnahAudioPreferences(): SunnahAudioPreferences {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultSunnahAudioPreferences();
    return normalizeSunnahAudioPreferences(JSON.parse(raw) as Partial<SunnahAudioPreferences>);
  } catch {
    return defaultSunnahAudioPreferences();
  }
}

export function saveSunnahAudioPreferences(prefs: SunnahAudioPreferences): void {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify(
        normalizeSunnahAudioPreferences({ ...prefs, updatedAt: new Date().toISOString() }),
      ),
    );
  } catch {
    /* quota */
  }
}

export function patchSunnahAudioPreferences(
  patch: Partial<SunnahAudioPreferences>,
): SunnahAudioPreferences {
  const next = normalizeSunnahAudioPreferences({ ...loadSunnahAudioPreferences(), ...patch });
  saveSunnahAudioPreferences(next);
  return next;
}
