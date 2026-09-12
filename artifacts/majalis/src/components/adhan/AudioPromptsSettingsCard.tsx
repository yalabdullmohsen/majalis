/**
 * بطاقة إعدادات مقاطع اقتراب الصلاة + الأذكار الصوتية.
 * المعاينة عبر AppAudioCoordinator فقط.
 */
import { useEffect, useMemo, useState } from "react";
import { Bell, Volume2 } from "lucide-react";
import {
  DHIKR_AUDIO_CATALOG,
  listPlayableDhikrClips,
  dhikrClipsNeedingRecording,
} from "@/lib/audio/dhikr-audio-catalog";
import {
  loadAudioPromptPrefs,
  patchAudioPromptPrefs,
  type AudioPromptPreferences,
  type PrayerPromptMode,
} from "@/lib/audio/audio-prompt-preferences";
import {
  PRAYER_PROMPT_CATALOG,
  listPlayablePrayerPrompts,
  type PrayerId,
  prayerPromptsNeedingRecording,
} from "@/lib/audio/prayer-prompt-catalog";
import {
  isAppAudioSourcePlaying,
  previewDhikrClip,
  previewPrayerPrompt,
  stopAppAudio,
} from "@/lib/audio/preview-helpers";
import { subscribeAppAudio } from "@/lib/audio/app-audio-coordinator";

const PRAYER_LABEL: Record<PrayerId, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const MODE_LABEL: Record<PrayerPromptMode, string> = {
  none: "بدون صوت",
  system: "صوت النظام",
  tone: "نغمة «اقترب أذان…»",
};

export function AudioPromptsSettingsCard() {
  const [prefs, setPrefs] = useState<AudioPromptPreferences>(() => loadAudioPromptPrefs());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const playablePrompts = useMemo(() => listPlayablePrayerPrompts(), []);
  const pendingSpoken = useMemo(() => prayerPromptsNeedingRecording().length, []);
  const playableDhikr = useMemo(() => listPlayableDhikrClips(), []);
  const pendingDhikr = useMemo(() => dhikrClipsNeedingRecording().length, []);

  useEffect(() => {
    return subscribeAppAudio((snap) => {
      if (snap.phase === "playing" && snap.activeSourceId) {
        setPlayingId(snap.activeSourceId);
      } else if (
        snap.phase === "idle" ||
        snap.phase === "failed" ||
        snap.phase === "interrupted"
      ) {
        setPlayingId(null);
      }
    });
  }, []);

  useEffect(() => () => {
    void stopAppAudio("leave");
  }, []);

  function update(patch: Partial<AudioPromptPreferences>) {
    setPrefs(patchAudioPromptPrefs(patch));
  }

  async function onPreviewPrompt(prayerId: PrayerId) {
    const clipId = prefs.prayerPromptClipId[prayerId];
    setMsg(null);
    if (playingId === clipId) {
      await stopAppAudio("user");
      return;
    }
    const res = await previewPrayerPrompt(clipId, "audio-prompts-settings");
    if (!res.ok) setMsg(res.error ?? "تعذّرت المعاينة");
  }

  async function onPreviewDhikr(id: string) {
    setMsg(null);
    if (playingId === id) {
      await stopAppAudio("user");
      return;
    }
    const res = await previewDhikrClip(id, "audio-prompts-settings");
    if (!res.ok) setMsg(res.error ?? "تعذّرت المعاينة");
  }

  return (
    <section className="soft-card soft-card--on-light audio-prompts-settings" aria-labelledby="audio-prompts-title">
      <header className="audio-prompts-settings__head">
        <Bell size={18} aria-hidden="true" />
        <div>
          <h2 id="audio-prompts-title">مقاطع التنبيه والأذكار</h2>
          <p>معاينة واحدة نشطة فقط — أي تشغيل جديد يوقف السابق فورًا.</p>
        </div>
      </header>

      <div className="audio-prompts-settings__block">
        <h3>صوت التنبيه قبل الصلاة</h3>
        <p className="audio-prompts-settings__hint">
          النغمات الحالية أصلية للمشروع. المقاطع المنطوقة ({pendingSpoken}) بانتظار تسجيل مرخّص.
        </p>
        <ul className="audio-prompts-settings__list">
          {(Object.keys(PRAYER_LABEL) as PrayerId[]).map((prayerId) => {
            const mode = prefs.prayerPromptByPrayer[prayerId];
            const clipId = prefs.prayerPromptClipId[prayerId];
            const clip = PRAYER_PROMPT_CATALOG.find((c) => c.id === clipId);
            const isPlaying = playingId === clipId && isAppAudioSourcePlaying(clipId);
            return (
              <li key={prayerId} className="audio-prompts-settings__row">
                <div>
                  <strong>{PRAYER_LABEL[prayerId]}</strong>
                  <p>{clip?.transcript ?? "—"}</p>
                </div>
                <label>
                  <span className="sr-only">وضع تنبيه {PRAYER_LABEL[prayerId]}</span>
                  <select
                    value={mode}
                    onChange={(e) =>
                      update({
                        prayerPromptByPrayer: {
                          ...prefs.prayerPromptByPrayer,
                          [prayerId]: e.target.value as PrayerPromptMode,
                        },
                      })
                    }
                  >
                    {(Object.keys(MODE_LABEL) as PrayerPromptMode[]).map((m) => (
                      <option key={m} value={m}>
                        {MODE_LABEL[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="mj-btn mj-btn--ghost"
                  disabled={mode !== "tone" || !playablePrompts.some((c) => c.id === clipId)}
                  aria-pressed={isPlaying}
                  onClick={() => void onPreviewPrompt(prayerId)}
                >
                  <Volume2 size={16} aria-hidden="true" />
                  {isPlaying ? "إيقاف" : "معاينة"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="audio-prompts-settings__block">
        <h3>الأذكار الصوتية</h3>
        <p className="audio-prompts-settings__hint">
          {playableDhikr.length === 0
            ? `لا ملفات مرخّصة بعد (${pendingDhikr} مقطع معلّق للتسجيل). النصوص معتمدة للعرض فقط.`
            : "اختر ذكرًا للمعاينة — بدون تشغيل قائمة تلقائية."}
        </p>
        <label className="audio-prompts-settings__toggle">
          <input
            type="checkbox"
            checked={prefs.dhikrAudioEnabled}
            onChange={(e) => update({ dhikrAudioEnabled: e.target.checked })}
          />
          تفعيل مقاطع الأذكار عند توفر تسجيل مرخّص
        </label>
        <label className="audio-prompts-settings__toggle">
          <input
            type="checkbox"
            checked={prefs.respectActiveLongForm}
            onChange={(e) => update({ respectActiveLongForm: e.target.checked })}
          />
          لا تقطع التلاوة أو الدرس بمقطع ذكر قصير
        </label>
        <label className="audio-prompts-settings__toggle">
          <input
            type="checkbox"
            checked={prefs.dhikrSilentNotification}
            onChange={(e) => update({ dhikrSilentNotification: e.target.checked })}
          />
          إشعار صامت بدل الصوت للأذكار
        </label>
        <ul className="audio-prompts-settings__list">
          {DHIKR_AUDIO_CATALOG.map((clip) => {
            const isPlaying = playingId === clip.id && isAppAudioSourcePlaying(clip.id);
            return (
              <li key={clip.id} className="audio-prompts-settings__row">
                <div>
                  <strong>{clip.transcript}</strong>
                  <p>
                    {clip.approvedForProduction
                      ? "جاهز للمعاينة"
                      : "بانتظار تسجيل مرخّص"}
                  </p>
                </div>
                <button
                  type="button"
                  className="mj-btn mj-btn--ghost"
                  disabled={!clip.approvedForProduction || !clip.previewUrl}
                  aria-pressed={isPlaying}
                  onClick={() => void onPreviewDhikr(clip.id)}
                >
                  {isPlaying ? "إيقاف" : "معاينة"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {msg ? (
        <p className="audio-prompts-settings__msg" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
