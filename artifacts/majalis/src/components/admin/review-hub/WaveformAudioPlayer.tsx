/**
 * Custom waveform audio player — play/pause + 0.8x / 1x / 1.2x.
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const SPEEDS = [0.8, 1, 1.2] as const;

export type WaveformAudioPlayerProps = {
  src: string;
  peaks: number[];
  label?: string;
  className?: string;
};

export function WaveformAudioPlayer({
  src,
  peaks,
  label = "مشغّل التلاوة",
  className,
}: WaveformAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    audio.playbackRate = speed;
    audioRef.current = audio;

    const onTime = () => {
      if (!audio.duration || !Number.isFinite(audio.duration)) return;
      setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onErr = () => {
      setPlaying(false);
      setError("تعذّر تشغيل الملف الصوتي");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

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
    audio.currentTime = Math.min(1, Math.max(0, ratio)) * audio.duration;
    setProgress(ratio);
  };

  return (
    <div
      className={`rh-waveform${className ? ` ${className}` : ""}`}
      dir="rtl"
      role="group"
      aria-label={label}
    >
      <div className="rh-waveform__row">
        <button
          type="button"
          className="rh-waveform__play"
          onClick={() => void toggle()}
          aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          type="button"
          className="rh-waveform__bars"
          aria-label="شريط الموجة — انقر للتقديم"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const rtlRatio = 1 - x / rect.width;
            seek(Math.min(1, Math.max(0, rtlRatio)));
          }}
        >
          {peaks.map((p, i) => {
            const active = i / peaks.length <= progress;
            return (
              <span
                key={i}
                className={`rh-waveform__bar${active ? " is-on" : ""}`}
                style={{ height: `${Math.round(p * 100)}%` }}
              />
            );
          })}
        </button>
      </div>

      <div className="rh-waveform__speeds" role="group" aria-label="سرعة التشغيل">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={`rh-waveform__speed${speed === s ? " is-on" : ""}`}
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
          >
            {s}x
          </button>
        ))}
      </div>

      {error ? (
        <p className="rh-waveform__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default WaveformAudioPlayer;
