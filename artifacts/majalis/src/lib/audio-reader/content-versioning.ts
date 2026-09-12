/**
 * Content / audio versioning helpers for Audio Reader cache safety.
 */

import { AUDIO_READER_VERSION } from "./types";

export type AudioArtifactVersionRecord = {
  contentId: string;
  contentVersion: string;
  audioVersion: string;
  readerVersion: string;
  manifestChecksum: string;
  createdAt: string;
};

export function buildAudioVersionId(
  contentVersion: string,
  manifestChecksum: string,
): string {
  return `av:${contentVersion}:${manifestChecksum.slice(0, 12)}`;
}

export function isAudioArtifactCompatible(opts: {
  contentVersion: string;
  artifact: AudioArtifactVersionRecord | null | undefined;
  expectedManifestChecksum: string;
}): { ok: true } | { ok: false; reason: string } {
  const a = opts.artifact;
  if (!a) return { ok: false, reason: "missing_artifact" };
  if (a.contentVersion !== opts.contentVersion) {
    return { ok: false, reason: "content_version_mismatch" };
  }
  if (a.manifestChecksum !== opts.expectedManifestChecksum) {
    return { ok: false, reason: "manifest_checksum_mismatch" };
  }
  if (a.readerVersion !== AUDIO_READER_VERSION) {
    // P0: reject cross-reader-version cache reuse (safe default)
    return { ok: false, reason: "reader_version_mismatch" };
  }
  return { ok: true };
}

export function createArtifactRecord(input: {
  contentId: string;
  contentVersion: string;
  manifestChecksum: string;
}): AudioArtifactVersionRecord {
  return {
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    audioVersion: buildAudioVersionId(
      input.contentVersion,
      input.manifestChecksum,
    ),
    readerVersion: AUDIO_READER_VERSION,
    manifestChecksum: input.manifestChecksum,
    createdAt: new Date().toISOString(),
  };
}
