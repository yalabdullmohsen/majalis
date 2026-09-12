/**
 * AudioReaderService — P0 skeleton.
 * Prepares manifests, enforces eligibility + TTS bans, claims exclusive audio.
 * Does NOT enable section playback or synthesize audio in P0.
 */

import {
  AUDIO_READER_VERSION,
  type AudioReaderSessionState,
  type ContentFamily,
  type NarrationManifest,
  type NarrationSource,
} from "./types";
import { getAudioReaderFlags, isFamilyPlaybackFlagOn } from "./feature-flags";
import { evaluateAudioReaderEligibility } from "./eligibility-policy";
import { assertTtsAllowed, detectProtectedText } from "./protected-text";
import {
  listTtsForbiddenSegments,
  prepareNarrationManifest,
  type PrepareNarrationInput,
} from "./narration-pipeline";
import { decideCloudNarration } from "./privacy";

type Listener = (state: AudioReaderSessionState) => void;

const SOURCE_PREFIX = "audio-reader:";

function nowIso(): string {
  return new Date().toISOString();
}

function idleState(): AudioReaderSessionState {
  return {
    phase: "idle",
    contentId: null,
    contentType: null,
    sectionId: null,
    paragraphId: null,
    currentSegment: 0,
    currentSentence: 0,
    currentPositionMs: 0,
    durationMs: 0,
    playbackRate: 1,
    voiceId: null,
    audioSource: "none",
    cacheStatus: "none",
    contentVersion: null,
    readerVersion: AUDIO_READER_VERSION,
    activeSourceId: null,
    requestToken: null,
    errorCode: null,
    lastUpdatedAt: nowIso(),
  };
}

let state: AudioReaderSessionState = idleState();
let manifest: NarrationManifest | null = null;
let tokenSeq = 0;
let chain: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function emit(): void {
  const copy = { ...state };
  for (const l of listeners) {
    try {
      l(copy);
    } catch {
      /* ignore */
    }
  }
}

function setState(patch: Partial<AudioReaderSessionState>): void {
  state = { ...state, ...patch, lastUpdatedAt: nowIso() };
  emit();
}

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function stopForeignAudio(): Promise<void> {
  try {
    const { stopAppAudio, forceStopAppAudioSync } = await import(
      "@/lib/audio/app-audio-coordinator"
    );
    forceStopAppAudioSync();
    await stopAppAudio("user");
  } catch {
    /* ignore */
  }
  try {
    const { stopSpeechReadAloud } = await import("@/lib/speech-read-aloud");
    stopSpeechReadAloud();
  } catch {
    /* ignore */
  }
  try {
    const { claimAudio } = await import("@/lib/exclusive-audio-bus");
    await claimAudio("audioReader", { skipCoordinatorStop: true });
  } catch {
    /* ignore */
  }
}

export function getAudioReaderState(): AudioReaderSessionState {
  return { ...state };
}

export function getAudioReaderManifest(): NarrationManifest | null {
  return manifest;
}

export function subscribeAudioReader(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export function prepareAudioReaderSession(
  input: PrepareNarrationInput,
): Promise<AudioReaderSessionState> {
  return enqueue(async () => {
    const token = `ar-${++tokenSeq}`;
    setState({
      ...idleState(),
      phase: "preparing",
      contentId: input.contentId,
      contentType: input.family,
      contentVersion: input.contentVersion,
      requestToken: token,
      audioSource: "none",
    });

    const detection = detectProtectedText(
      `${input.title ?? ""}\n${input.body ?? ""}`,
    );
    const eligibility = evaluateAudioReaderEligibility({
      contentId: input.contentId,
      family: input.family,
      published: input.published !== false,
      needsReview: Boolean(input.needsReview),
      incomplete: Boolean(input.incomplete) || !(input.body || "").trim(),
      missingMandatorySource: Boolean(input.missingMandatorySource),
      contentVersion: input.contentVersion,
      containsProtectedText: detection.containsProtectedText,
      canSafelySeparateProtected: true,
      unsupportedElements: Boolean(input.unsupportedElements),
    });

    if (!eligibility.mayPrepareNarration) {
      manifest = null;
      setState({
        phase: "failed",
        errorCode: eligibility.reasons[0] ?? "not_eligible",
        requestToken: token,
      });
      return { ...state };
    }

    const next = prepareNarrationManifest(input);
    for (const seg of listTtsForbiddenSegments(next)) {
      const gate = assertTtsAllowed(seg.protectedStatus);
      if (gate.ok) {
        manifest = null;
        setState({
          phase: "failed",
          errorCode: "protected_segment_misclassified",
          requestToken: token,
        });
        return { ...state };
      }
    }

    const cloud = decideCloudNarration({
      userDisabledCloud: true,
      published: input.published !== false,
      protectedKinds: detection.kinds,
      isUserPrivateNote: false,
    });
    const audioSource: NarrationSource = cloud.allowed
      ? "cloud_tts"
      : "local_tts";

    manifest = next;
    const durationMs = next.segments.reduce(
      (sum, s) => sum + (s.ttsForbidden ? 0 : s.estimatedDurationMs),
      0,
    );
    setState({
      phase: "ready",
      contentId: next.contentId,
      contentType: next.contentType,
      contentVersion: next.contentVersion,
      durationMs,
      audioSource,
      cacheStatus: "none",
      activeSourceId: `${SOURCE_PREFIX}${next.contentId}`,
      requestToken: token,
      errorCode: null,
      currentSegment: 0,
    });
    return { ...state };
  });
}

/**
 * P0: refuse live playback unless flags allow (defaults: all OFF).
 * When refused, state stays ready/failed without speaking.
 */
export function requestAudioReaderPlayback(opts?: {
  userInitiated?: boolean;
}): Promise<
  | { ok: true; state: AudioReaderSessionState }
  | { ok: false; reason: string; state: AudioReaderSessionState }
> {
  return enqueue(async () => {
    if (!opts || opts.userInitiated !== true) {
      return {
        ok: false as const,
        reason: "requires_user_gesture",
        state: { ...state },
      };
    }
    if (!manifest || state.phase !== "ready") {
      return {
        ok: false as const,
        reason: "session_not_ready",
        state: { ...state },
      };
    }
    const flags = getAudioReaderFlags();
    const family = state.contentType as ContentFamily | null;
    if (
      !flags.audioReaderEnabled ||
      !family ||
      !isFamilyPlaybackFlagOn(family, flags)
    ) {
      return {
        ok: false as const,
        reason: "playback_flag_disabled_p0",
        state: { ...state },
      };
    }

    // Protected segments must be skipped — never spoken via TTS
    const speakable = manifest.segments.filter((s) => !s.ttsForbidden);
    if (speakable.length === 0) {
      return {
        ok: false as const,
        reason: "no_speakable_segments",
        state: { ...state },
      };
    }
    for (const seg of speakable) {
      const gate = assertTtsAllowed(seg.protectedStatus);
      if (!gate.ok) {
        return {
          ok: false as const,
          reason: gate.reason,
          state: { ...state },
        };
      }
    }

    await stopForeignAudio();
    try {
      const { beginLongFormAudio } = await import(
        "@/lib/audio/app-audio-coordinator"
      );
      await beginLongFormAudio(
        "audioReader",
        state.activeSourceId ?? `${SOURCE_PREFIX}${manifest.contentId}`,
        { screenId: "audio-reader", mayResumeAfterInterruption: true },
      );
    } catch {
      /* coordinator optional in unit env */
    }

    setState({ phase: "playing" });
    return { ok: true as const, state: { ...state } };
  });
}

/** Idempotent stop — safe under rapid repeated calls. */
export function stopAudioReader(reason = "user"): Promise<void> {
  return enqueue(async () => {
    void reason;
    try {
      const { stopSpeechReadAloud } = await import("@/lib/speech-read-aloud");
      stopSpeechReadAloud();
    } catch {
      /* ignore */
    }
    try {
      const { endLongFormAudio, forceStopAppAudioSync } = await import(
        "@/lib/audio/app-audio-coordinator"
      );
      endLongFormAudio(state.activeSourceId ?? undefined);
      forceStopAppAudioSync();
    } catch {
      /* ignore */
    }
    try {
      const { releaseAudio } = await import("@/lib/exclusive-audio-bus");
      releaseAudio("audioReader");
    } catch {
      /* ignore */
    }
    const keepProgress = {
      contentId: state.contentId,
      contentType: state.contentType,
      contentVersion: state.contentVersion,
      currentSegment: state.currentSegment,
      currentPositionMs: state.currentPositionMs,
      playbackRate: state.playbackRate,
    };
    setState({
      ...idleState(),
      ...keepProgress,
      phase: "idle",
      readerVersion: AUDIO_READER_VERSION,
    });
    manifest = null;
  });
}

/** Called by exclusive bus / coordinator when another source claims audio. */
export function forceStopAudioReaderFromBus(): void {
  try {
    // sync path — no await
    void import("@/lib/speech-read-aloud").then((m) => m.stopSpeechReadAloud());
  } catch {
    /* ignore */
  }
  if (state.phase === "idle" && !state.activeSourceId) return;
  setState({
    ...state,
    phase: "interrupted",
    activeSourceId: null,
    requestToken: null,
  });
  manifest = null;
}

export function __resetAudioReaderForTests(): void {
  state = idleState();
  manifest = null;
  tokenSeq = 0;
  chain = Promise.resolve();
  listeners.clear();
}
