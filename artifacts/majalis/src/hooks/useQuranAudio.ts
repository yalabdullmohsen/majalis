import { useCallback, useEffect, useRef, useState } from "react";
import {
  QURAN_RECITERS,
  getReciterAudioUrl,
  getReciterById,
  getSavedReciterId,
  saveReciterId,
  getAudioPosition,
  saveAudioPosition,
  type QuranReciter,
} from "@/lib/quran-reciters";

export type PlaybackMode = "surah" | "ayah";
export type PlaybackRate = 0.75 | 1 | 1.25 | 1.5;

export function useQuranAudio(surah: number, targetAyah: number) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [reciterId, setReciterId] = useState(getSavedReciterId);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [loop, setLoop] = useState(false);
  const [mode, setMode] = useState<PlaybackMode>("surah");
  const [pickerOpen, setPickerOpen] = useState(false);

  const reciter = getReciterById(reciterId) || QURAN_RECITERS[0];

  useEffect(() => {
    saveReciterId(reciterId);
  }, [reciterId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = getReciterAudioUrl(reciter, surah);
    audio.playbackRate = rate;
    const saved = getAudioPosition(reciterId, surah);
    if (saved > 0) audio.currentTime = saved;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      saveAudioPosition(reciterId, surah, audio.currentTime);
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      if (loop) audio.play().catch(() => undefined);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, [reciter, reciterId, surah, rate, loop]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => undefined);
  }, [playing]);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, t));
  }, [duration]);

  const skip = useCallback((delta: number) => {
    seek(currentTime + delta);
  }, [currentTime, seek]);

  const playFromAyah = useCallback((_ayah: number) => {
    setMode("ayah");
    togglePlay();
  }, [togglePlay]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return {
    audioRef,
    reciter,
    reciterId,
    setReciterId,
    playing,
    togglePlay,
    currentTime,
    duration,
    seek,
    skip,
    rate,
    setRate,
    loop,
    setLoop,
    mode,
    setMode,
    playFromAyah,
    pickerOpen,
    setPickerOpen,
    formatTime,
    reciters: QURAN_RECITERS,
  };
}

export type QuranAudioState = ReturnType<typeof useQuranAudio>;
