/**
 * Privacy — local-first; never send protected / unpublished / private notes to cloud.
 */

import type { AudioReaderPrivacyPolicy, ProtectedKind } from "./types";
import { getAudioReaderFlags } from "./feature-flags";

export const AUDIO_READER_PRIVACY: AudioReaderPrivacyPolicy = {
  preferLocalNarration: true,
  cloudNarrationAllowed: false,
  sendUserPrivateNotes: false,
  sendUnpublishedContent: false,
  sendProtectedText: false,
  logFullNarrationText: false,
  userCanDisableCloud: true,
};

export type CloudNarrationDecision =
  | { allowed: false; reason: string }
  | { allowed: true };

export function decideCloudNarration(input: {
  userDisabledCloud: boolean;
  published: boolean;
  protectedKinds: ProtectedKind[];
  isUserPrivateNote: boolean;
}): CloudNarrationDecision {
  const flags = getAudioReaderFlags();
  if (!flags.cloudNarrationEnabled || !AUDIO_READER_PRIVACY.cloudNarrationAllowed) {
    return { allowed: false, reason: "cloud_narration_disabled" };
  }
  if (input.userDisabledCloud) {
    return { allowed: false, reason: "user_disabled_cloud" };
  }
  if (!input.published) {
    return { allowed: false, reason: "unpublished_content" };
  }
  if (input.isUserPrivateNote) {
    return { allowed: false, reason: "private_notes" };
  }
  const blocked = input.protectedKinds.filter((k) => k !== "none");
  if (blocked.length > 0) {
    return { allowed: false, reason: `protected:${blocked.join(",")}` };
  }
  // P0 product policy: local only even if flag later flips for tests
  return { allowed: false, reason: "p0_local_only" };
}

/** Safe analytics / log payload — never include full narration text. */
export function redactNarrationForLogs(input: {
  contentId: string;
  contentVersion: string;
  segmentCount: number;
  errorCode?: string;
}): Record<string, string | number> {
  return {
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    segmentCount: input.segmentCount,
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
  };
}

export function assertNoApiKeyInClientBundle(source: string): boolean {
  const patterns = [
    /ANTHROPIC_API_KEY\s*=\s*['"][^'"]+['"]/,
    /sk-[a-zA-Z0-9]{20,}/,
    /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_-]{16,}['"]/i,
  ];
  return !patterns.some((p) => p.test(source));
}

export function logContainsFullNarrationText(
  logLine: string,
  narrationText: string,
): boolean {
  const needle = narrationText.trim();
  if (needle.length < 24) return false;
  return logLine.includes(needle);
}
