/**
 * فهرس سور مسطّح — يستخدم بحث الانتقال الموحّد (مصدر واحد).
 */
import { QuranSurahJumpSearch } from "@/components/quran/QuranSurahJumpSearch";
import { getSurahListItem, type SurahListItem } from "@/lib/quran-surah-list";

export type SurahIndexFlatListProps = {
  currentSurah?: number;
  onNavigateToPage?: (page: number, item: SurahListItem) => void;
  className?: string;
};

/** FlatList-style surah catalog — بحث + قائمة من مكوّن واحد. */
export function SurahIndexFlatList({
  currentSurah,
  onNavigateToPage,
  className,
}: SurahIndexFlatListProps) {
  void currentSurah;
  return (
    <QuranSurahJumpSearch
      className={className}
      onNavigateToPage={
        onNavigateToPage
          ? (page, opts) => {
              const id = opts?.surah ?? 1;
              const item = getSurahListItem(id) ?? { id, name: "", page };
              onNavigateToPage(page, item);
            }
          : undefined
      }
    />
  );
}

export default SurahIndexFlatList;
