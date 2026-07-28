/**
 * Lightweight Web Speech verse verification — hint states only, never stops audio.
 */

import { diffRecitation } from "@/lib/recitation-diff";
import { normalizeQuranWord } from "@/lib/recitation-ai/quran-normalize";
import { idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type RecitationHintKind =
  | "none"
  | "hesitation"
  | "missing_word"
  | "mispronunciation"
  | "behind"
  | "complete";

export type RecitationHintState = {
  kind: RecitationHintKind;
  matchPercent: number;
  firstIssueAt: number;
  hintWord: string | null;
  transcript: string;
  updatedAt: number;
};

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceVerificationAvailable(): boolean {
  return getCtor() !== null;
}

export function emptyHintState(): RecitationHintState {
  return { kind: "none", matchPercent: 0, firstIssueAt: -1, hintWord: null, transcript: "", updatedAt: Date.now() };
}

export function matchRecitationTranscript(
  targetText: string,
  spokenText: string,
  opts?: { hesitationDetected?: boolean },
): RecitationHintState {
  const diff = diffRecitation(targetText, spokenText);
  const targetWords = targetText.split(/\s+/).filter(Boolean);
  const spokenWords = spokenText.split(/\s+/).filter(Boolean).map((w) => normalizeQuranWord(w));
  const firstIssueAt = diff.words.findIndex((w) => !w.matched);
  let kind: RecitationHintKind = "none";
  if (diff.matchPercent >= 95 && firstIssueAt < 0) kind = "complete";
  else if (opts?.hesitationDetected) kind = "hesitation";
  else if (!spokenWords.length) kind = "none";
  else if (firstIssueAt >= 0 && spokenWords.length < targetWords.length * 0.85) {
    kind = spokenWords.length < firstIssueAt + 1 ? "missing_word" : "behind";
  } else if (firstIssueAt >= 0) {
    const spokenAt = spokenWords[Math.min(firstIssueAt, spokenWords.length - 1)];
    const targetAt = normalizeQuranWord(targetWords[firstIssueAt] || "");
    kind = spokenAt && spokenAt !== targetAt ? "mispronunciation" : "missing_word";
  }
  return {
    kind,
    matchPercent: diff.matchPercent,
    firstIssueAt,
    hintWord: firstIssueAt >= 0 ? targetWords[firstIssueAt] ?? null : null,
    transcript: spokenText,
    updatedAt: Date.now(),
  };
}

export class VoiceRecitationVerifier {
  private recognition: ReturnType<SpeechCtor> | null = null;
  private intentionallyStopped = false;
  private lastSpeechAt = 0;
  private hesitationTimer: ReturnType<typeof setTimeout> | null = null;
  private finalTranscript = "";
  private targetText = "";
  private onHint: ((h: RecitationHintState) => void) | null = null;
  lastHint = emptyHintState();

  start(targetText: string, onHint?: (h: RecitationHintState) => void): boolean {
    const Ctor = getCtor();
    if (!Ctor) return false;
    this.stop();
    this.targetText = targetText;
    this.onHint = onHint || null;
    this.intentionallyStopped = false;
    this.finalTranscript = "";
    this.lastSpeechAt = Date.now();
    const rec = new Ctor();
    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      let interim = "";
      let finals = this.finalTranscript;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const row = event.results[i];
        const piece = row?.[0]?.transcript || "";
        if (row.isFinal) finals = `${finals} ${piece}`.trim();
        else interim = `${interim} ${piece}`.trim();
      }
      this.finalTranscript = finals;
      this.lastSpeechAt = Date.now();
      this.armHesitation();
      this.emit(`${finals} ${interim}`.trim(), false);
    };
    rec.onerror = () => undefined;
    rec.onend = () => {
      if (!this.intentionallyStopped) {
        try {
          rec.start();
          return;
        } catch {
          /* ignore */
        }
      }
    };
    this.recognition = rec;
    try {
      rec.start();
      this.armHesitation();
      return true;
    } catch {
      return false;
    }
  }

  setTargetText(text: string): void {
    this.targetText = text;
    this.emit(this.finalTranscript, false);
  }

  stop(): void {
    this.intentionallyStopped = true;
    if (this.hesitationTimer) clearTimeout(this.hesitationTimer);
    try {
      this.recognition?.stop();
    } catch {
      /* ignore */
    }
    this.recognition = null;
  }

  private armHesitation(): void {
    if (this.hesitationTimer) clearTimeout(this.hesitationTimer);
    this.hesitationTimer = setTimeout(() => {
      if (!this.intentionallyStopped && Date.now() - this.lastSpeechAt >= 2_200) {
        this.emit(this.finalTranscript, true);
      }
    }, 2_200);
  }

  private emit(spoken: string, hesitation: boolean): void {
    this.lastHint = matchRecitationTranscript(this.targetText, spoken, { hesitationDetected: hesitation });
    this.onHint?.(this.lastHint);
    void idbPut(OFFLINE_STORES.meta, "voice-verify-last-hint", this.lastHint).catch(() => undefined);
  }
}
