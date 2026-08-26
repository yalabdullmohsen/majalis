/**
 * مشغّل تسجيل الدرس — يدعم الانتقال لوقت محدد من الرابط (?t=).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatLessonTimestampLabel,
  shareLessonAtTimestamp,
  type UnifiedLesson,
} from "@/lib/unified-lesson-card";
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

  useEffect(() => {
    seekApplied.current = false;
  }, [src, startAtSeconds]);

  const applySeek = useCallback(() => {
    const el = audioRef.current;
    if (!el || seekApplied.current || startAtSeconds == null || startAtSeconds <= 0) return;
    if (!Number.isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.min(startAtSeconds, el.duration - 0.5);
    seekApplied.current = true;
  }, [startAtSeconds]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => applySeek();
    el.addEventListener("loadedmetadata", onMeta);
    return () => el.removeEventListener("loadedmetadata", onMeta);
  }, [applySeek]);

  const handleShareAt = useCallback(async () => {
    const t = Math.floor(audioRef.current?.currentTime ?? currentTime);
    await shareLessonAtTimestamp(lesson, t);
    setShareHint(`تم نسخ رابط من ${formatLessonTimestampLabel(t)}`);
    window.setTimeout(() => setShareHint(null), 2500);
  }, [lesson, currentTime]);

  return (
    <div className="lesson-recording-player" data-testid="lesson-recording-player">
      <h2>تسجيل الدرس</h2>
      {startAtSeconds != null && startAtSeconds > 0 && (
        <p className="lesson-recording-player__seek-note">
          بدء من {formatLessonTimestampLabel(startAtSeconds)}
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
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
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
