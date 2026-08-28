import { useSyncExternalStore } from "react";

type AudioClock = {
  currentTime: number;
  duration: number;
  playbackRate: number;
};

type Listener = () => void;

let clock: AudioClock = { currentTime: 0, duration: 0, playbackRate: 1 };
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn();
}

/** يحدّث ساعة الصوت دون إعادة رسم صفحة المصحف. */
export function setMushafAudioClock(next: Partial<AudioClock>): void {
  const merged: AudioClock = {
    currentTime: next.currentTime ?? clock.currentTime,
    duration: next.duration ?? clock.duration,
    playbackRate: next.playbackRate ?? clock.playbackRate,
  };
  if (
    merged.currentTime === clock.currentTime &&
    merged.duration === clock.duration &&
    merged.playbackRate === clock.playbackRate
  ) {
    return;
  }
  clock = merged;
  emit();
}

export function getMushafAudioClock(): AudioClock {
  return clock;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMushafAudioClock(): AudioClock {
  return useSyncExternalStore(subscribe, getMushafAudioClock, getMushafAudioClock);
}

export function resetMushafAudioClockForTests(): void {
  clock = { currentTime: 0, duration: 0, playbackRate: 1 };
  listeners.clear();
}
