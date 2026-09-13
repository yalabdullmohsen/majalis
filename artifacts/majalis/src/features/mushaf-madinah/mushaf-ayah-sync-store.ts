import { useSyncExternalStore } from "react";

type SyncListener = () => void;

/** تحديد يدوي (فتح أدوات الآية) */
let manuallySelectedVerseKey: string | null = null;
/** تمييز تلاوة */
let audioHighlightedVerseKey: string | null = null;
/** تمييز تنقّل سياقي من أقسام أخرى — لا يفتح تفسيرًا ولا أدواتًا */
let navigationHighlightedVerseKey: string | null = null;

const listeners = new Set<SyncListener>();

function emit(): void {
  for (const fn of listeners) {
    fn();
  }
}

/** توافق خلفي: selected = يدوي، playing = صوت */
export function setMushafAyahSyncKeys(selected: string | null, playing: string | null): void {
  if (manuallySelectedVerseKey === selected && audioHighlightedVerseKey === playing) return;
  manuallySelectedVerseKey = selected;
  audioHighlightedVerseKey = playing;
  emit();
}

export function setNavigationHighlightedAyahId(verseKey: string | null): void {
  if (navigationHighlightedVerseKey === verseKey) return;
  navigationHighlightedVerseKey = verseKey;
  emit();
}

export function getNavigationHighlightedAyahId(): string | null {
  return navigationHighlightedVerseKey;
}

export function getMushafAyahSyncKeys(): {
  selected: string | null;
  playing: string | null;
  navigation: string | null;
} {
  return {
    selected: manuallySelectedVerseKey,
    playing: audioHighlightedVerseKey,
    navigation: navigationHighlightedVerseKey,
  };
}

function subscribe(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** اشتراك محلي — تحديد يدوي فقط (التنقّل عبر overlay بلا تغيير لون الحبر) */
export function useMushafAyahWordSelected(verseKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => manuallySelectedVerseKey === verseKey,
    () => false,
  );
}

export function useMushafAyahWordPlaying(verseKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => audioHighlightedVerseKey === verseKey,
    () => false,
  );
}

export function useMushafAyahWordNavigation(verseKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigationHighlightedVerseKey === verseKey,
    () => false,
  );
}

/** مفتاح الآية الجارية فقط — لطبقة التظليل دون props من الصفحة. */
export function useMushafAyahPlayingKey(): string | null {
  return useSyncExternalStore(subscribe, () => audioHighlightedVerseKey, () => null);
}

/** مفتاح الآية المحددة يدويًا — لطبقة التحديد السطري. */
export function useMushafAyahSelectedKey(): string | null {
  return useSyncExternalStore(subscribe, () => manuallySelectedVerseKey, () => null);
}

/** مفتاح تمييز التنقّل السياقي */
export function useMushafAyahNavigationKey(): string | null {
  return useSyncExternalStore(subscribe, () => navigationHighlightedVerseKey, () => null);
}

export function resetMushafAyahSyncStoreForTests(): void {
  manuallySelectedVerseKey = null;
  audioHighlightedVerseKey = null;
  navigationHighlightedVerseKey = null;
  listeners.clear();
}
