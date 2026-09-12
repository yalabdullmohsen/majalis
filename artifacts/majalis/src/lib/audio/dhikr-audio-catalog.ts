/**
 * كتالوج مقاطع الأذكار والتسبيح — النص ثابت؛ الصوت معلّق حتى تسجيل مرخّص.
 */
import type { AppAudioKind, AppAudioLicenseStatus } from "./app-audio-types";

export type DhikrAudioClip = {
  id: string;
  type: Extract<AppAudioKind, "dhikrPrompt" | "tasbeehPrompt">;
  locale: "ar";
  transcript: string;
  speakerName: string | null;
  durationSec: number | null;
  format: "mp3" | "caf" | "m4a" | "pending";
  previewUrl: string | null;
  licenseStatus: AppAudioLicenseStatus;
  source: string;
  approvedForProduction: boolean;
  version: string;
};

function pending(
  id: string,
  transcript: string,
  type: DhikrAudioClip["type"] = "dhikrPrompt",
): DhikrAudioClip {
  return {
    id,
    type,
    locale: "ar",
    transcript,
    speakerName: null,
    durationSec: null,
    format: "pending",
    previewUrl: null,
    licenseStatus: "needs_recording",
    source: "مطلوب تسجيل مرخّص + مراجعة نطق — ممنوع TTS بلا مراجعة",
    approvedForProduction: false,
    version: "0",
  };
}

export const DHIKR_AUDIO_CATALOG: readonly DhikrAudioClip[] = [
  pending("dhikr-la-ilaha-illallah", "لا إله إلا الله"),
  pending("dhikr-subhanallah", "سبحان الله", "tasbeehPrompt"),
  pending("dhikr-alhamdulillah", "الحمد لله", "tasbeehPrompt"),
  pending("dhikr-allahu-akbar", "الله أكبر", "tasbeehPrompt"),
  pending("dhikr-subhanallah-wa-bihamdih", "سبحان الله وبحمده", "tasbeehPrompt"),
  pending("dhikr-subhanallah-al-azim", "سبحان الله العظيم", "tasbeehPrompt"),
  pending("dhikr-astaghfirullah", "أستغفر الله"),
  pending("dhikr-hawqala", "لا حول ولا قوة إلا بالله"),
  pending("dhikr-salawat", "اللهم صل وسلم على نبينا محمد ﷺ"),
];

export function getDhikrClipById(id: string): DhikrAudioClip | undefined {
  return DHIKR_AUDIO_CATALOG.find((c) => c.id === id);
}

export function listPlayableDhikrClips(): DhikrAudioClip[] {
  return DHIKR_AUDIO_CATALOG.filter((c) => c.approvedForProduction && Boolean(c.previewUrl));
}

export function dhikrClipsNeedingRecording(): DhikrAudioClip[] {
  return DHIKR_AUDIO_CATALOG.filter((c) => c.licenseStatus === "needs_recording");
}
