/**
 * Flutter `QuranReaderWidget` — immersive page view + verse sheet + tafsir modal.
 */
import { useCallback, useState } from "react";
import { ImmersiveQuranApp } from "@/components/quran/ImmersiveQuranApp";
import { TafsirModalViewer } from "@/components/quran/TafsirModalViewer";
import { QuranRepository } from "@/lib/quran-repository";
import type { QuranAppController } from "@/lib/quran-app-controller";

export type QuranReaderWidgetProps = {
  controller: QuranAppController;
  className?: string;
  onToggleAudio?: (index: number, playing: boolean, text: string) => void;
};

export function QuranReaderWidget({
  controller,
  className,
  onToggleAudio,
}: QuranReaderWidgetProps) {
  const [tafsir, setTafsir] = useState<{ verse: string; tafsir: string } | null>(
    null,
  );

  const onTafsirVerse = useCallback((index: number, text: string) => {
    const record = QuranRepository.getVerses()[index];
    setTafsir({
      verse: text,
      tafsir: record?.tafsir ?? "لا يتوفر تفسير لهذه الآية في العينة.",
    });
  }, []);

  return (
    <>
      <ImmersiveQuranApp
        className={className}
        controller={controller}
        verses={QuranRepository.getVerseTexts()}
        onToggleAudio={onToggleAudio}
        onTafsirVerse={onTafsirVerse}
        embedded
      />
      {tafsir ? (
        <TafsirModalViewer
          verseText={tafsir.verse}
          tafsirText={tafsir.tafsir}
          onClose={() => setTafsir(null)}
        />
      ) : null}
    </>
  );
}

export default QuranReaderWidget;
