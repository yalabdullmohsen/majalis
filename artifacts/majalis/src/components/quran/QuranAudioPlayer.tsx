/**
 * مشغّل تلاوة المصحف — مضغوط، لا يغطي الآيات.
 */
import { useState } from "react";
import type { PlayerState } from "@/core/audio/AudioEngine";
import { QuranRecitationService } from "@/lib/quran/quranRecitationService";
import { MushafAudioDock } from "@/features/mushaf-madinah/MushafAudioDock";
import type { RecitationRange } from "@/features/mushaf-madinah/mushaf-page-for-ayah";

type Props = {
  open: boolean;
  verseLabel: string;
  playerState: PlayerState;
  reciterId: string;
  audioError?: string | null;
  audioStatus?: string | null;
  iosHint?: string | null;
  mini?: boolean;
  onMiniChange?: (mini: boolean) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReciterChange: (id: string) => void;
  onPlayReciter?: (id: string) => void;
  onRetry?: () => void;
  onPickOtherReciter?: () => void;
  onClose?: () => void;
  onSeek?: (seconds: number) => void;
  onSpeed?: (rate: number) => void;
  onPlayRange?: (range: RecitationRange, repeatCount: number, delayMs?: number) => void;
};

export function QuranAudioPlayer({
  open,
  verseLabel,
  playerState,
  reciterId,
  audioError = null,
  audioStatus = null,
  iosHint = null,
  mini = false,
  onMiniChange,
  onTogglePlay,
  onPrev,
  onNext,
  onReciterChange,
  onPlayReciter,
  onRetry,
  onPickOtherReciter,
  onClose,
  onSeek,
  onSpeed,
  onPlayRange,
}: Props) {
  const [readersForced, setReadersForced] = useState(false);
  const showError = playerState === "error" || Boolean(audioError);
  const userMessage = showError
    ? QuranRecitationService.userErrorMessage(audioError)
    : null;

  return (
    <div className="quran-audio-player" data-testid="quran-audio-player" data-mini={mini ? "1" : "0"}>
      <MushafAudioDock
        open={open}
        verseLabel={verseLabel}
        playerState={playerState}
        reciterId={reciterId}
        audioError={userMessage}
        audioStatus={iosHint || audioStatus}
        mini={mini}
        onMiniChange={onMiniChange}
        onTogglePlay={onTogglePlay}
        onPrev={onPrev}
        onNext={onNext}
        onReciterChange={onReciterChange}
        onPlayReciter={onPlayReciter}
        onClose={onClose}
        onSeek={onSeek}
        onSpeed={onSpeed}
        onPlayRange={onPlayRange}
        readersOpen={readersForced}
        onReadersOpenChange={setReadersForced}
      />
      {showError ? (
        <div className="quran-audio-player__fallback" role="alert">
          <p>{userMessage || "تعذر تشغيل التلاوة الآن"}</p>
          <div className="quran-audio-player__fallback-actions">
            {onRetry ? (
              <button type="button" className="quran-audio-player__btn" onClick={onRetry}>
                إعادة المحاولة
              </button>
            ) : null}
            <button
              type="button"
              className="quran-audio-player__btn"
              onClick={() => {
                if (onPickOtherReciter) onPickOtherReciter();
                else setReadersForced(true);
              }}
            >
              اختيار قارئ آخر
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
