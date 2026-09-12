/**
 * واجهة مختصرة لمعاينة المقاطع عبر المنسّق المركزي.
 */
import {
  canAutoDuckForKind,
  isAppAudioSourcePlaying,
  playAppAudio,
  stopAppAudio,
} from "./app-audio-coordinator";
import { getDhikrClipById } from "./dhikr-audio-catalog";
import { getPrayerPromptById } from "./prayer-prompt-catalog";

export async function previewNotificationTone(
  sourceId: string,
  url: string,
  screenId = "settings-notifications",
): Promise<{ ok: boolean; error?: string }> {
  const snap = await playAppAudio({
    sourceId,
    kind: "notificationPreview",
    url,
    shortLived: true,
    userInitiated: true,
    screenId,
    maxMs: 8_000,
  });
  if (snap.phase === "failed") return { ok: false, error: snap.lastError ?? "فشل المعاينة" };
  return { ok: true };
}

export async function previewAdhanUrl(
  sourceId: string,
  url: string,
  screenId = "settings-adhan",
  maxMs = 15_000,
): Promise<{ ok: boolean; error?: string }> {
  const snap = await playAppAudio({
    sourceId,
    kind: "adhanPreview",
    url,
    shortLived: true,
    userInitiated: true,
    screenId,
    maxMs,
  });
  if (snap.phase === "failed") return { ok: false, error: snap.lastError ?? "فشل المعاينة" };
  return { ok: true };
}

export async function previewPrayerPrompt(
  clipId: string,
  screenId = "settings-prayer-prompts",
): Promise<{ ok: boolean; error?: string }> {
  const clip = getPrayerPromptById(clipId);
  if (!clip) return { ok: false, error: "المقطع غير موجود" };
  if (!clip.approvedForProduction || !clip.previewUrl) {
    return { ok: false, error: "المقطع المنطوق غير متاح بعد — بانتظار تسجيل مرخّص." };
  }
  if (!canAutoDuckForKind("prayerPrompt")) {
    return { ok: false, error: "يوجد تشغيل طويل نشط (تلاوة/درس). أوقفه أولًا." };
  }
  const snap = await playAppAudio({
    sourceId: clip.id,
    kind: "prayerPrompt",
    url: clip.previewUrl,
    shortLived: true,
    userInitiated: true,
    screenId,
    transcript: clip.transcript,
    maxMs: 8_000,
  });
  if (snap.phase === "failed") return { ok: false, error: snap.lastError ?? "فشل المعاينة" };
  return { ok: true };
}

export async function previewDhikrClip(
  clipId: string,
  screenId = "settings-dhikr-audio",
): Promise<{ ok: boolean; error?: string }> {
  const clip = getDhikrClipById(clipId);
  if (!clip) return { ok: false, error: "الذكر غير موجود" };
  if (!clip.approvedForProduction || !clip.previewUrl) {
    return { ok: false, error: "لا يوجد تسجيل مرخّص لهذا الذكر بعد." };
  }
  if (!canAutoDuckForKind(clip.type)) {
    return { ok: false, error: "يوجد تشغيل طويل نشط. أوقفه قبل معاينة الذكر." };
  }
  const snap = await playAppAudio({
    sourceId: clip.id,
    kind: clip.type,
    url: clip.previewUrl,
    shortLived: true,
    userInitiated: true,
    screenId,
    transcript: clip.transcript,
    maxMs: 8_000,
  });
  if (snap.phase === "failed") return { ok: false, error: snap.lastError ?? "فشل المعاينة" };
  return { ok: true };
}

export { stopAppAudio, isAppAudioSourcePlaying };
