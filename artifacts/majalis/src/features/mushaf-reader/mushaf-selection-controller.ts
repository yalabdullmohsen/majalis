/**
 * مصدر تحديد الآية الوحيد في قارئ المصحف.
 * لا يكتب المكوّنون التحديد مباشرة — فقط عبر selectAyah / clearAyahSelection.
 */
import { useSyncExternalStore } from "react";

export type MushafAyahSelection = {
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
};

export type MushafSelectionState =
  | { kind: "NONE" }
  | { kind: "SELECTED"; selection: MushafAyahSelection; verseKey: string };

type Listener = () => void;

let state: MushafSelectionState = { kind: "NONE" };
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMushafSelectionState(): MushafSelectionState {
  return state;
}

export function getSelectedVerseKey(): string | null {
  return state.kind === "SELECTED" ? state.verseKey : null;
}

export function verseKeyFromSelection(selection: MushafAyahSelection): string {
  return `${selection.surahNumber}:${selection.ayahNumber}`;
}

export function selectAyah(selection: MushafAyahSelection): void {
  const verseKey = verseKeyFromSelection(selection);
  if (
    state.kind === "SELECTED" &&
    state.verseKey === verseKey &&
    state.selection.pageNumber === selection.pageNumber
  ) {
    return;
  }
  state = { kind: "SELECTED", selection: { ...selection }, verseKey };
  emit();
}

/** يمسح التحديد دائمًا — لا يُحجَب أثناء التلاوة (تمييز الصوت منفصل). */
export function clearAyahSelection(): void {
  if (state.kind === "NONE") return;
  state = { kind: "NONE" };
  emit();
}

export function isAyahSelected(selection: MushafAyahSelection): boolean {
  if (state.kind !== "SELECTED") return false;
  return (
    state.selection.surahNumber === selection.surahNumber &&
    state.selection.ayahNumber === selection.ayahNumber
  );
}

export function useMushafSelectionState(): MushafSelectionState {
  return useSyncExternalStore(subscribe, getMushafSelectionState, () => ({ kind: "NONE" as const }));
}

export function useSelectedVerseKey(): string | null {
  return useSyncExternalStore(subscribe, getSelectedVerseKey, () => null);
}

/** للاختبارات فقط */
export function __resetMushafSelectionForTests(): void {
  state = { kind: "NONE" };
  emit();
}
