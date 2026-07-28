/**
 * Flutter-style linear audio scrubber for recitation review cards.
 * play/pause + progress + elapsed/duration (matches AdminDashboard sketch).
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export type LinearAudioReviewPlayerProps = {
  src: string;
  className?: string;
};

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LinearAudioReviewPlayer({
  src,
  className,
}: LinearAudioReviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => {
      setCurrent(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
    };
    const onErr = () => {
      setPlaying(false);
      setError("تعذّر تشغيل الملف");
    };

    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
      audioRef.current = null;
    };
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch {
      setError("اضغط مرة أخرى للسماح بالتشغيل");
      setPlaying(false);
    }
  };

  const seek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const r = Math.min(1, Math.max(0, ratio));
    audio.currentTime = r * audio.duration;
    setProgress(r);
  };

  return (
    <div className={`rh-linear-audio${className ? ` ${className}` : ""}`} dir="rtl">
      <button
        type="button"
        className="rh-linear-audio__play"
        onClick={() => void toggle()}
        aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
      >
        {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      <button
        type="button"
        className="rh-linear-audio__track"
        aria-label="شريط التقدم"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          /* RTL: click near start (right) = low progress */
          const ratio = 1 - x / rect.width;
          seek(ratio);
        }}
      >
        <span className="rh-linear-audio__bar" style={{ width: `${progress * 100}%` }} />
      </button>
      <span className="rh-linear-audio__time">
        {fmt(current)} / {fmt(duration || 10)}
      </span>
      {error ? (
        <p className="rh-linear-audio__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default LinearAudioReviewPlayer;
