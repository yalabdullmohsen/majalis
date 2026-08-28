import { useSyncExternalStore } from "react";

type SyncListener = () => void;

let selectedVerseKey: string | null = null;
let playingVerseKey: string | null = null;
const listeners = new Set<SyncListener>();

function emit(): void {
  for (const fn of listeners) {
    fn();
  }
}

export function setMushafAyahSyncKeys(selected: string | null, playing: string | null): void {
  if (selectedVerseKey === selected && playingVerseKey === playing) return;
  selectedVerseKey = selected;
  playingVerseKey = playing;
  emit();
}

export function getMushafAyahSyncKeys(): { selected: string | null; playing: string | null } {
  return { selected: selectedVerseKey, playing: playingVerseKey };
}

function subscribe(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** اشتراك محلي — يُعيد رسم الكلمة فقط عند تغيّر حالتها */
export function useMushafAyahWordSelected(verseKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => selectedVerseKey === verseKey,
    () => false,
  );
}

export function useMushafAyahWordPlaying(verseKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => playingVerseKey === verseKey,
    () => false,
  );
}

/** مفتاح الآية الجارية فقط — لطبقة التظليل دون props من الصفحة. */
export function useMushafAyahPlayingKey(): string | null {
  return useSyncExternalStore(subscribe, () => playingVerseKey, () => null);
}

export function resetMushafAyahSyncStoreForTests(): void {
  selectedVerseKey = null;
  playingVerseKey = null;
  listeners.clear();
}
