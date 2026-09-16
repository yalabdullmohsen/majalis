/**
 * بطاقة إعدادات مقاطع اقتراب الصلاة + الأذكار الصوتية.
 * يعرض فقط الأصوات الجاهزة للتشغيل — بلا خيارات بانتظار ترخيص.
 */
import { useEffect, useMemo, useState } from "react";
import { Bell, Volume2 } from "lucide-react";
import {
  listPlayableDhikrClips,
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
  tone: "نغمة قصيرة",
};

export function AudioPromptsSettingsCard() {
  const [prefs, setPrefs] = useState<AudioPromptPreferences>(() => loadAudioPromptPrefs());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const playablePrompts = useMemo(() => listPlayablePrayerPrompts(), []);
  const playableDhikr = useMemo(() => listPlayableDhikrClips(), []);

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
          <h2 id="audio-prompts-title">التنبيهات المبكرة والأذكار</h2>
          <p>نغمات جاهزة فقط — بلا خيارات معلّقة.</p>
        </div>
      </header>

      <div className="audio-prompts-settings__block">
        <h3>صوت قبل الصلاة</h3>
        <ul className="audio-prompts-settings__list">
          {(Object.keys(PRAYER_LABEL) as PrayerId[]).map((prayerId) => {
            const mode = prefs.prayerPromptByPrayer[prayerId];
            const clipId = prefs.prayerPromptClipId[prayerId];
            const clip = playablePrompts.find((c) => c.id === clipId)
              ?? PRAYER_PROMPT_CATALOG.find((c) => c.prayerId === prayerId && c.approvedForProduction);
            const effectiveClipId = clip?.id ?? clipId;
            const canPreview = mode === "tone" && Boolean(clip?.previewUrl);
            const isPlaying = playingId === effectiveClipId && isAppAudioSourcePlaying(effectiveClipId);
            return (
              <li key={prayerId} className="audio-prompts-settings__row">
                <div>
                  <strong>{PRAYER_LABEL[prayerId]}</strong>
                  <p>{clip?.transcript ?? "نغمة قصيرة"}</p>
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
                  disabled={!canPreview}
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
        <h3>الأذكار</h3>
        {playableDhikr.length === 0 ? (
          <p className="audio-prompts-settings__hint" role="status">
            لا مقاطع أذكار صوتية جاهزة حاليًا. يبقى تذكير النص من إعدادات التنبيهات.
          </p>
        ) : (
          <ul className="audio-prompts-settings__list">
            {playableDhikr.map((clip) => {
              const isPlaying = playingId === clip.id && isAppAudioSourcePlaying(clip.id);
              return (
                <li key={clip.id} className="audio-prompts-settings__row">
                  <div>
                    <strong>{clip.transcript}</strong>
                  </div>
                  <button
                    type="button"
                    className="mj-btn mj-btn--ghost"
                    aria-pressed={isPlaying}
                    onClick={() => void onPreviewDhikr(clip.id)}
                  >
                    {isPlaying ? "إيقاف" : "معاينة"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <label className="audio-prompts-settings__toggle">
          <input
            type="checkbox"
            checked={prefs.respectActiveLongForm}
            onChange={(e) => update({ respectActiveLongForm: e.target.checked })}
          />
          لا تقطع التلاوة أو الدرس بتنبيه قصير
        </label>
      </div>

      {msg ? (
        <p className="audio-prompts-settings__msg" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
