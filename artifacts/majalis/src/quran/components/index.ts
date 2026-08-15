/**
 * RN `/components` — small reusable UI (verse card, control bar, lists).
 */

export { QuranViewer, renderQuranText, THEMES } from "@/components/QuranViewer";
export type { QuranViewerProps, QuranReaderThemeId } from "@/components/QuranViewer";

export { QuranActionBar } from "@/components/QuranActionBar";
export type { QuranActionBarAyah, QuranActionBarProps } from "@/components/QuranActionBar";

export { default as HomeDashboard } from "@/components/HomeDashboard";

export { SurahIndexFlatList } from "@/components/quran/SurahIndexFlatList";
export { SurahList } from "@/components/quran/SurahList";
export { ReadingBreakDialog } from "@/components/quran/ReadingBreakDialog";
export { QuranReaderPage } from "@/components/quran/QuranReaderPage";
export type { QuranReaderPageProps } from "@/components/quran/QuranReaderPage";
export { QuranVerseList } from "@/components/quran/QuranVerseList";
export type { QuranVerseListProps } from "@/components/quran/QuranVerseList";
export { ImmersiveQuranPage } from "@/components/quran/ImmersiveQuranPage";
export type { ImmersiveQuranPageProps } from "@/components/quran/ImmersiveQuranPage";
export { ImmersiveVerseOptionsSheet } from "@/components/quran/ImmersiveVerseOptionsSheet";
export type { ImmersiveVerseOptionsSheetProps } from "@/components/quran/ImmersiveVerseOptionsSheet";
export { ImmersivePrefsDrawer } from "@/components/quran/ImmersivePrefsDrawer";
export type { ImmersivePrefsDrawerProps } from "@/components/quran/ImmersivePrefsDrawer";
export { ImmersiveQuranApp } from "@/components/quran/ImmersiveQuranApp";
export type { ImmersiveQuranAppProps } from "@/components/quran/ImmersiveQuranApp";
export { TafsirModalViewer } from "@/components/quran/TafsirModalViewer";
export type { TafsirModalViewerProps } from "@/components/quran/TafsirModalViewer";
