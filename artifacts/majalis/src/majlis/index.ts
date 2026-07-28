/**
 * majlis / Flutter MajlisIlmApp façade barrels.
 */
export { MajlisIlmApp, MainNavigationScreen } from "@/components/majlis/MainNavigationScreen";
export type { MajlisIlmAppProps } from "@/components/majlis/MainNavigationScreen";
export { QuranReaderWidget } from "@/components/majlis/QuranReaderWidget";
export type { QuranReaderWidgetProps } from "@/components/majlis/QuranReaderWidget";
export { EducationalCoursesWidget } from "@/components/majlis/EducationalCoursesWidget";
export type { EducationalCoursesWidgetProps } from "@/components/majlis/EducationalCoursesWidget";
export { SmartSearchPanel } from "@/components/majlis/SmartSearchPanel";
export type { SmartSearchPanelProps } from "@/components/majlis/SmartSearchPanel";
export { AIRecitationWidget } from "@/components/majlis/AIRecitationWidget";
export type { AIRecitationWidgetProps } from "@/components/majlis/AIRecitationWidget";
export {
  MajlisAudioService,
  getMajlisAudioService,
  createMajlisAudioService,
} from "@/lib/majlis-audio-service";
export {
  LocalStorageService,
  getLocalStorageService,
} from "@/lib/majlis-local-storage-service";
