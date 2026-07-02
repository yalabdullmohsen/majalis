import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

type AudioLesson = {
  id: string;
  title: string;
  speaker_name: string | null;
  live_url: string | null;
  audio_url: string | null;
  category: string | null;
};

const CAR_LAST_KEY = "majalis_car_last_v1";

function saveLastLesson(id: string) {
  try { localStorage.setItem(CAR_LAST_KEY, id); } catch { /* localStorage unavailable */ }
}
function loadLastLessonId(): string | null {
  try { return localStorage.getItem(CAR_LAST_KEY); } catch { return null; }
}

export default function CarModePage() {
  const [lessons, setLessons] = useState<AudioLesson[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("lessons")
          .select("id, title, speaker_name, live_url, audio_url, category, external_key")
          .eq("status", "approved")
          .not("live_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (cancelled) return;

        const rows: AudioLesson[] = (data ?? [])
          .filter((l: any) => l.live_url || l.audio_url)
          .map((l: any) => ({
            id: l.external_key || l.id,
            title: l.title,
            speaker_name: l.speaker_name,
            live_url: l.live_url,
            audio_url: l.audio_url,
            category: l.category,
          }));
        setLessons(rows);

        const lastId = loadLastLessonId();
        if (lastId) {
          const idx = rows.findIndex((r) => r.id === lastId);
          if (idx >= 0) setCurrentIdx(idx);
        }
      } catch { /* network error */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const current = lessons[currentIdx];
  const audioSrc = current?.audio_url || current?.live_url || "";

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const goNext = () => {
    const next = Math.min(currentIdx + 1, lessons.length - 1);
    setCurrentIdx(next);
    setPlaying(false);
    saveLastLesson(lessons[next]?.id ?? "");
  };

  const goPrev = () => {
    const prev = Math.max(currentIdx - 1, 0);
    setCurrentIdx(prev);
    setPlaying(false);
    saveLastLesson(lessons[prev]?.id ?? "");
  };

  const selectLesson = (idx: number) => {
    setCurrentIdx(idx);
    setPlaying(false);
    saveLastLesson(lessons[idx]?.id ?? "");
  };

  // Sync audio element when current changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    audio.load();
    setPlaying(false);
  }, [audioSrc]);

  if (loading) {
    return (
      <div className="car-mode car-mode--loading" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="car-mode" dir="rtl">
        <div className="car-mode__empty">
          <p>لا تتوفر دروس صوتية حالياً.</p>
          <Link href="/" className="car-mode__back-btn">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="car-mode" dir="rtl">
      {/* Hidden audio element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={goNext}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="car-mode__header">
        <Link href="/" className="car-mode__exit">✕ خروج</Link>
        <span className="car-mode__label">وضع السيارة 🚗</span>
      </div>

      {/* Now playing */}
      <div className="car-mode__now-playing">
        <div className="car-mode__disk">{playing ? "🎵" : "🎙️"}</div>
        <p className="car-mode__category">{current.category ?? "درس"}</p>
        <h1 className="car-mode__title">{current.title}</h1>
        {current.speaker_name && (
          <p className="car-mode__speaker">{current.speaker_name}</p>
        )}
        <p className="car-mode__counter">{currentIdx + 1} / {lessons.length}</p>
      </div>

      {/* Controls */}
      <div className="car-mode__controls">
        <button
          type="button"
          className="car-mode__btn car-mode__btn--sm"
          onClick={goPrev}
          disabled={currentIdx === 0}
          aria-label="السابق"
        >
          ⏮
        </button>
        <button
          type="button"
          className="car-mode__btn car-mode__btn--play"
          onClick={togglePlay}
          aria-label={playing ? "إيقاف" : "تشغيل"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          className="car-mode__btn car-mode__btn--sm"
          onClick={goNext}
          disabled={currentIdx === lessons.length - 1}
          aria-label="التالي"
        >
          ⏭
        </button>
      </div>

      {/* Playlist (scrollable list below controls) */}
      <div className="car-mode__playlist">
        {lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            type="button"
            className={`car-mode__playlist-item${idx === currentIdx ? " car-mode__playlist-item--active" : ""}`}
            onClick={() => selectLesson(idx)}
          >
            <span className="car-mode__playlist-num">{idx + 1}</span>
            <span className="car-mode__playlist-title">{lesson.title}</span>
            {lesson.speaker_name && (
              <span className="car-mode__playlist-speaker">{lesson.speaker_name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
