/**
 * Voice Recitation Verification Engine (Web Speech API).
 * Listens to user recitation, matches against target verse text in real-time,
 * and emits subtle hint states (hesitation / missing / mispronunciation)
 * without interrupting audio playback flows.
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
  /** 0–100 match against target */
  matchPercent: number;
  /** Index of first unmatched target word (0-based), or -1 */
  firstIssueAt: number;
  /** Suggested hint word (target) — for subtle UI consumers */
  hintWord: string | null;
  transcript: string;
  updatedAt: number;
};

export type VoiceVerifySessionConfig = {
  targetText: string;
  /** Silence gap (ms) that counts as hesitation */
  hesitationMs?: number;
  lang?: string;
  continuous?: boolean;
};

export type VoiceVerifyCallbacks = {
  onHint?: (hint: RecitationHintState) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (code: string) => void;
  onEnd?: () => void;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechCtor = new () => SpeechRecognitionLike;

const LS_STATS = "majalis-voice-verify-stats-v1";
const IDB_STATS = "voice-verify-stats-v1";
const DEFAULT_HESITATION_MS = 2_200;

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceVerificationAvailable(): boolean {
  return getSpeechCtor() !== null;
}

export function emptyHintState(): RecitationHintState {
  return {
    kind: "none",
    matchPercent: 0,
    firstIssueAt: -1,
    hintWord: null,
    transcript: "",
    updatedAt: Date.now(),
  };
}

/**
 * Pure matcher: compare spoken transcript to target verse.
 * Does not touch audio — safe alongside ayah playback.
 */
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
  if (diff.matchPercent >= 95 && firstIssueAt < 0) {
    kind = "complete";
  } else if (opts?.hesitationDetected) {
    kind = "hesitation";
  } else if (spokenWords.length === 0) {
    kind = "none";
  } else if (firstIssueAt >= 0 && spokenWords.length < targetWords.length * 0.85) {
    kind = spokenWords.length < firstIssueAt + 1 ? "missing_word" : "behind";
  } else if (firstIssueAt >= 0) {
    // Spoken something that didn't match → mispronunciation / wrong word
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

export type VoiceVerifyStats = {
  sessions: number;
  avgMatchPercent: number;
  hesitationCount: number;
  updatedAt: string;
};

function loadStats(): VoiceVerifyStats {
  try {
    const raw = localStorage.getItem(LS_STATS);
    if (!raw) return { sessions: 0, avgMatchPercent: 0, hesitationCount: 0, updatedAt: new Date(0).toISOString() };
    return JSON.parse(raw) as VoiceVerifyStats;
  } catch {
    return { sessions: 0, avgMatchPercent: 0, hesitationCount: 0, updatedAt: new Date(0).toISOString() };
  }
}

function saveStats(stats: VoiceVerifyStats): void {
  try {
    localStorage.setItem(LS_STATS, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_STATS, stats).catch(() => undefined);
}

export function recordVoiceVerifySession(matchPercent: number, hesitations: number): VoiceVerifyStats {
  const prev = loadStats();
  const sessions = prev.sessions + 1;
  const avgMatchPercent = Math.round(
    (prev.avgMatchPercent * prev.sessions + matchPercent) / sessions,
  );
  const next: VoiceVerifyStats = {
    sessions,
    avgMatchPercent,
    hesitationCount: prev.hesitationCount + hesitations,
    updatedAt: new Date().toISOString(),
  };
  saveStats(next);
  return next;
}

export function getVoiceVerifyStats(): VoiceVerifyStats {
  return loadStats();
}

/**
 * Lightweight Web Speech session manager for verse verification.
 * Audio playback is never stopped — this is listen-only.
 */
export class VoiceRecitationVerifier {
  private recognition: SpeechRecognitionLike | null = null;
  private intentionallyStopped = false;
  private lastSpeechAt = 0;
  private hesitationTimer: ReturnType<typeof setTimeout> | null = null;
  private hesitationCount = 0;
  private finalTranscript = "";
  private lastHint = emptyHintState();
  private config: VoiceVerifySessionConfig | null = null;
  private callbacks: VoiceVerifyCallbacks = {};

  get hint(): RecitationHintState {
    return this.lastHint;
  }

  get available(): boolean {
    return isVoiceVerificationAvailable();
  }

  start(config: VoiceVerifySessionConfig, callbacks?: VoiceVerifyCallbacks): boolean {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      callbacks?.onError?.("unsupported");
      return false;
    }
    this.stop();
    this.config = config;
    this.callbacks = callbacks || {};
    this.intentionallyStopped = false;
    this.finalTranscript = "";
    this.hesitationCount = 0;
    this.lastHint = emptyHintState();
    this.lastSpeechAt = Date.now();

    const rec = new Ctor();
    rec.lang = config.lang || "ar-SA";
    rec.interimResults = true;
    rec.continuous = config.continuous !== false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      let finals = this.finalTranscript;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const row = event.results[i];
        const piece = row?.[0]?.transcript || "";
        if (row.isFinal) {
          finals = `${finals} ${piece}`.trim();
        } else {
          interim = `${interim} ${piece}`.trim();
        }
      }
      this.finalTranscript = finals;
      this.lastSpeechAt = Date.now();
      this.armHesitationWatch();

      const spoken = `${finals} ${interim}`.trim();
      this.callbacks.onTranscript?.(spoken, interim.length === 0 && finals.length > 0);
      this.emitHint(spoken, false);
    };

    rec.onerror = (ev) => {
      // Don't treat aborted as fatal — audio flows stay untouched
      if (ev.error === "aborted" || ev.error === "no-speech") return;
      this.callbacks.onError?.(ev.error);
    };

    rec.onend = () => {
      if (!this.intentionallyStopped && this.config) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      this.clearHesitationWatch();
      if (this.config) {
        recordVoiceVerifySession(this.lastHint.matchPercent, this.hesitationCount);
      }
      this.callbacks.onEnd?.();
    };

    this.recognition = rec;
    try {
      rec.start();
      this.armHesitationWatch();
      return true;
    } catch {
      this.callbacks.onError?.("start_failed");
      return false;
    }
  }

  /** Update target verse mid-session without restarting recognition. */
  setTargetText(text: string): void {
    if (!this.config) return;
    this.config = { ...this.config, targetText: text };
    this.emitHint(this.finalTranscript, false);
  }

  stop(): void {
    this.intentionallyStopped = true;
    this.clearHesitationWatch();
    try {
      this.recognition?.stop();
    } catch {
      try {
        this.recognition?.abort?.();
      } catch {
        /* ignore */
      }
    }
    this.recognition = null;
  }

  private armHesitationWatch(): void {
    this.clearHesitationWatch();
    const ms = this.config?.hesitationMs ?? DEFAULT_HESITATION_MS;
    this.hesitationTimer = setTimeout(() => {
      if (this.intentionallyStopped) return;
      if (Date.now() - this.lastSpeechAt < ms) return;
      this.hesitationCount += 1;
      this.emitHint(this.finalTranscript, true);
    }, ms);
  }

  private clearHesitationWatch(): void {
    if (this.hesitationTimer) {
      clearTimeout(this.hesitationTimer);
      this.hesitationTimer = null;
    }
  }

  private emitHint(spoken: string, hesitationDetected: boolean): void {
    if (!this.config) return;
    const hint = matchRecitationTranscript(this.config.targetText, spoken, { hesitationDetected });
    this.lastHint = hint;
    this.callbacks.onHint?.(hint);
  }
}
