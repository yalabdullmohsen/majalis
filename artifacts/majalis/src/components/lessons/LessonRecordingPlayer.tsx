/**
 * مشغّل تسجيل الدرس — يدعم ?t= واستئناف الموضع المحلي.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatLessonTimestampLabel,
  shareLessonAtTimestamp,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
import { loadLessonAudioResume, saveLessonAudioResume } from "@/lib/lesson-audio-resume";
import { recordUserActivity } from "@/lib/user-streak";

type Props = {
  lesson: UnifiedLesson;
  src: string;
  startAtSeconds?: number | null;
};

export function LessonRecordingPlayer({ lesson, src, startAtSeconds }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const seekApplied = useRef(false);
  const lastPersistAt = useRef(0);
  const resumeSeconds = startAtSeconds != null && startAtSeconds > 0
    ? startAtSeconds
    : loadLessonAudioResume(lesson.id);

  useEffect(() => {
    seekApplied.current = false;
  }, [src, startAtSeconds, lesson.id]);

  const applySeek = useCallback(() => {
    const el = audioRef.current;
    if (!el || seekApplied.current || resumeSeconds == null || resumeSeconds <= 0) return;
    if (!Number.isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.min(resumeSeconds, Math.max(0, el.duration - 0.5));
    seekApplied.current = true;
  }, [resumeSeconds]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => applySeek();
    el.addEventListener("loadedmetadata", onMeta);
    return () => el.removeEventListener("loadedmetadata", onMeta);
  }, [applySeek]);

  const persist = useCallback(
    (t: number) => {
      const now = Date.now();
      if (now - lastPersistAt.current < 4000 && t > 3) return;
      lastPersistAt.current = now;
      saveLessonAudioResume(lesson.id, t);
    },
    [lesson.id],
  );

  useEffect(() => {
    const flush = () => {
      const t = audioRef.current?.currentTime;
      if (typeof t === "number" && t >= 3) saveLessonAudioResume(lesson.id, t);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, [lesson.id]);

  const handleShareAt = useCallback(async () => {
    const t = Math.floor(audioRef.current?.currentTime ?? currentTime);
    await shareLessonAtTimestamp(lesson, t);
    setShareHint(`تم نسخ رابط من ${formatLessonTimestampLabel(t)}`);
    window.setTimeout(() => setShareHint(null), 2500);
  }, [lesson, currentTime]);

  return (
    <div className="lesson-recording-player" data-testid="lesson-recording-player">
      <h2>تسجيل الدرس</h2>
      {resumeSeconds != null && resumeSeconds > 0 && (
        <p className="lesson-recording-player__seek-note">
          بدء من {formatLessonTimestampLabel(resumeSeconds)}
          {startAtSeconds == null || startAtSeconds <= 0 ? " (آخر موضع)" : ""}
        </p>
      )}
      {/* تسجيل صوتي للدرس — بلا ترجمة نصية متاحة */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        playsInline
        src={src}
        className="lesson-recording-player__audio"
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrentTime(t);
          persist(t);
        }}
        onPause={(e) => saveLessonAudioResume(lesson.id, e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => recordUserActivity("lesson")}
      />
      <div className="lesson-recording-player__actions">
        <button
          type="button"
          className="lesson-unified-card__btn lesson-unified-card__btn--secondary"
          onClick={() => void handleShareAt()}
          disabled={!duration && currentTime <= 0}
        >
          مشاركة من {formatLessonTimestampLabel(currentTime)}
        </button>
        {shareHint && (
          <span className="lesson-recording-player__hint" role="status">
            {shareHint}
          </span>
        )}
      </div>
    </div>
  );
}

export default LessonRecordingPlayer;
