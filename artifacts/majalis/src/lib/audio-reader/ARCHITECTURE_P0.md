# Sunnah Interactive Audio Reader — P0 Architecture

Brand: **سُنّة**. Scope: protection + architecture only. No section playback enablement.

## Audit (existing audio)

| Source | Location | Notes |
|---|---|---|
| AppAudioCoordinator | `src/lib/audio/app-audio-coordinator.ts` | Single HTMLAudio queue + token |
| Exclusive bus | `src/lib/exclusive-audio-bus.ts` | claimAudio owners |
| Tilawa / mini player | AudioEngine + quran-mini-player | Human recitation |
| Lessons | majlis-audio-service | Long-form |
| Adhan preview | adhan-playback / adhan-audio-service | Short |
| Legacy speech | `speech-read-aloud.ts` | Web Speech; was **outside** bus (P0 wires stop into coordinator/bus) |

**TTS today:** local Web Speech only (no cloud API key in client). P0 keeps cloud OFF.

## P0 modules

- `eligibility-policy.ts` — blocked vs prepare-allowed families
- `protected-text.ts` — detect/partition Quran/hadith/dhikr/adhan
- `narration-pipeline.ts` — derived manifest, checksum, no synthesis
- `audio-reader-service.ts` — state machine; prepare → ready; playback gated by flags (all false)
- `privacy.ts` — local-first; redact logs; refuse cloud for protected/unpublished
- `content-versioning.ts` — cache must match content + manifest + reader version
- `feature-flags.ts` — all playback flags **false**

## Single audio

- New kind: `audioReader` on coordinator + bus owner `audioReader`
- Starting other audio stops reader + speech
- Starting reader claims bus and stops foreign engines

## Not in P0

- Mini/Full reader UI, offline downloads, sleep timer, synchronized reading UI
- Enabling `prophetsStoriesAudioEnabled` or any section flag
- Cloud narration / API keys
- Generating audio files
