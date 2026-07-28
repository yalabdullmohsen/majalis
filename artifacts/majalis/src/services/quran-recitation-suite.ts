/**
 * Quranic Recitations & Memorization Suite (Module 2 facade).
 */

import {
  loadAudioResumeState,
  loadAudioResumeStateAsync,
  saveAudioResumeState,
  scrollActiveAyahIntoView,
  type QuranAudioResumeState,
} from "@/lib/quran-audio-resume";
import {
  normalizeLoopConfig,
  createLoopRuntime,
  advanceAfterAyahEnded,
  type AyahLoopConfig,
} from "@/lib/ayah-loop-controller";
import { searchQuranTopics, type QuranTopicSearchHit } from "@/lib/quran-topics-index";
import { MUTASHABIHAT, type MutashabihatPair } from "@/lib/mutashabihat-data";
import { normalizeArabic } from "@/shared/arabic-normalize";
import {
  advanceAfterBlockAyahEnded,
  createVerseBlockRuntime,
  normalizeVerseAudioBlock,
  persistVerseBlockPref,
  type VerseAudioBlock,
  type VerseBlockRuntime,
} from "@/services/verse-audio-blocks";
import {
  executeAutoScroll,
  hydrateAutoScrollFromIdb,
  planAutoScroll,
  recordVerseDwell,
  scheduleAutoScroll,
} from "@/services/adaptive-auto-scroll";
import {
  isVoiceVerificationAvailable,
  matchRecitationTranscript,
  VoiceRecitationVerifier,
} from "@/services/voice-recitation-verify";
import { findGhareebInAyahText, lookupGhareeb, type GhareebEntry } from "@/services/ghareeb-lexicon";

export type MutashabihatDiff = {
  pair: MutashabihatPair;
  /** Letter/word discrepancy hint from pair description */
  discrepancyHint: string;
};

export type QuranSearchBundle = {
  topics: QuranTopicSearchHit[];
  mutashabihat: MutashabihatDiff[];
  ghareeb: GhareebEntry[];
};

export function saveResumePosition(state: QuranAudioResumeState): void {
  saveAudioResumeState(state);
}

export function loadResumePosition(): QuranAudioResumeState | null {
  return loadAudioResumeState();
}

export async function loadResumePositionAsync(): Promise<QuranAudioResumeState | null> {
  return loadAudioResumeStateAsync();
}

export function syncVerseHighlightScroll(
  ayah: number,
  opts?: { container?: HTMLElement | null; syncWithAudio?: boolean },
): boolean {
  const cmd = planAutoScroll({ ayah, syncWithAudio: opts?.syncWithAudio });
  if (cmd) return executeAutoScroll(cmd, opts?.container);
  return scrollActiveAyahIntoView(ayah, { container: opts?.container });
}

export function createAyahRangeLoop(
  startAyah: number,
  endAyah: number,
  totalAyahs: number,
  opts?: { repeatCount?: number; delayMs?: number },
): AyahLoopConfig {
  return normalizeLoopConfig(
    {
      startAyah,
      endAyah,
      repeatCount: opts?.repeatCount ?? 3,
      delayMs: opts?.delayMs ?? 400,
    },
    totalAyahs,
  );
}

export function startMultiVerseBlock(
  surah: number,
  startAyah: number,
  endAyah: number,
  totalAyahs: number,
  opts?: { blockSize?: number; blockRepeats?: number },
): VerseBlockRuntime {
  const block = normalizeVerseAudioBlock(
    {
      surah,
      startAyah,
      endAyah,
      blockSize: opts?.blockSize,
      blockRepeats: opts?.blockRepeats,
    },
    totalAyahs,
  );
  persistVerseBlockPref(block);
  return createVerseBlockRuntime(block);
}

export function advanceMultiVerseBlock(runtime: VerseBlockRuntime, finishedAyah: number) {
  return advanceAfterBlockAyahEnded(runtime, finishedAyah);
}

/** Semantic/topic search + mutashabihat + ghareeb (normalized Arabic). */
export function searchQuranSemantic(query: string, limit = 8): QuranSearchBundle {
  const nq = normalizeArabic(query);
  const topics = searchQuranTopics(query, limit);
  const mutashabihat: MutashabihatDiff[] = MUTASHABIHAT.filter((p) => {
    const blob = normalizeArabic(`${p.title} ${p.description} ${p.hint || ""}`);
    return Boolean(nq) && (blob.includes(nq) || nq.includes(normalizeArabic(p.title)));
  })
    .slice(0, limit)
    .map((pair) => ({
      pair,
      discrepancyHint: pair.hint || pair.description,
    }));
  const ghareeb = lookupGhareeb(query, limit);
  return { topics, mutashabihat, ghareeb };
}

export function analyzeAyahVocabulary(ayahText: string): GhareebEntry[] {
  return findGhareebInAyahText(ayahText);
}

export function findMutashabihatForRef(surah: number, ayah: number): MutashabihatPair[] {
  return MUTASHABIHAT.filter((p) => p.refs.some((r) => r.surah === surah && r.ayah === ayah));
}

export {
  createLoopRuntime,
  advanceAfterAyahEnded,
  hydrateAutoScrollFromIdb,
  recordVerseDwell,
  scheduleAutoScroll,
  isVoiceVerificationAvailable,
  matchRecitationTranscript,
  VoiceRecitationVerifier,
};

export type { VerseAudioBlock, VerseBlockRuntime, AyahLoopConfig, GhareebEntry };
