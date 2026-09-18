/**
 * AIReaderOrchestrator — مسار السرد العربي لسُنّة.
 * الذكاء/التجهيز يحسّن النطق والتقسيم فقط؛ لا يعيد كتابة المحتوى الشرعي.
 */

import { partitionProtectedText } from "@/lib/audio-reader/protected-text";
import { prepareArabicForNarration } from "./arabic-prep";
import {
  resolveNarrationProsody,
  type NarrationContentKind,
  type NarrationProsody,
  type ReadingMode,
} from "./narration-profiles";
import {
  applyPronunciationLexicon,
  lexiconWordCount,
  PRONUNCIATION_LEXICON_VERSION,
} from "./pronunciation-lexicon";
import {
  assertSegmentsPreserveText,
  buildArabicSsml,
  segmentEditorialText,
  SSML_VERSION,
  type SsmlSegment,
} from "./ssml-builder";
import { isNeuralTtsClientEnabled, requestNeuralTts } from "./neural-tts-client";
import {
  isSpeechReadAloudSupported,
  speakArabicSegments,
  stopSpeechReadAloud,
} from "@/lib/speech-read-aloud";

export type NarrationEngine = "azure-neural" | "device-speech" | "none";

export type OrchestratorPrepareResult = {
  contentId: string;
  speakableText: string;
  displayText: string;
  protectedSkipped: number;
  segments: SsmlSegment[];
  ssml: string;
  textMatchOk: boolean;
  lexiconVersion: string;
  ssmlVersion: string;
  lexiconSize: number;
  prosody: NarrationProsody;
  /** نصوص المقاطع للجهاز — بعد التجهيز فقط */
  deviceSegmentTexts: string[];
};

export type OrchestratorPlayResult = {
  ok: boolean;
  engine: NarrationEngine;
  reason?: string;
  /** لا تُعرض للمستخدم كـ«ذكاء اصطناعي» ما لم تكن azure-neural */
  userLabel: string;
};

let activeAudio: HTMLAudioElement | null = null;
let playGeneration = 0;

function stripNoise(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b[a-z0-9_-]+\.(tsx?|jsx?|mjs|css)\b/gi, " ")
    .replace(/[✦★☆•●○◆◇]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** يستخرج نصًا قابلًا للقراءة مع عزل المحمي + تجهيز عربي + قاموس. */
export function prepareNarrationForPlayback(input: {
  contentId: string;
  body: string;
  title?: string;
  rate?: number;
  mode?: ReadingMode;
  contentKind?: NarrationContentKind;
}): OrchestratorPrepareResult {
  const prosody = resolveNarrationProsody({
    mode: input.mode,
    contentKind: input.contentKind,
  });
  const rate = input.rate ?? prosody.rate;

  const displayText = [input.title, input.body].filter(Boolean).join("\n\n");
  const cleaned = stripNoise(displayText);
  const pieces = partitionProtectedText(cleaned);
  const speakableParts = pieces
    .filter((p) => p.type === "speakable")
    .map((p) => p.text.trim())
    .filter(Boolean);
  const protectedSkipped = pieces.filter((p) => p.type === "protected").length;
  const speakableJoined = prepareArabicForNarration(speakableParts.join("\n\n"));
  const pronounced = applyPronunciationLexicon(speakableJoined);
  const segments = segmentEditorialText(pronounced);
  const match = assertSegmentsPreserveText(pronounced, segments);
  const usableSegments: SsmlSegment[] = match.ok
    ? segments
    : pronounced
      ? [{ kind: "paragraph", text: pronounced }]
      : [];
  const ssml = buildArabicSsml({
    segments: usableSegments.length
      ? usableSegments
      : [{ kind: "paragraph", text: pronounced }],
    locale: "ar-SA",
    voiceName: "ar-SA-ZariyahNeural",
    rate,
    breakScale: prosody.breakScale,
  });
  const deviceSegmentTexts = usableSegments
    .filter((s) => s.kind !== "break")
    .map((s) => s.text.trim())
    .filter(Boolean);

  return {
    contentId: input.contentId,
    speakableText: pronounced,
    displayText: cleaned,
    protectedSkipped,
    segments: usableSegments,
    ssml,
    textMatchOk: match.ok,
    lexiconVersion: PRONUNCIATION_LEXICON_VERSION,
    ssmlVersion: SSML_VERSION,
    lexiconSize: lexiconWordCount(),
    prosody,
    deviceSegmentTexts,
  };
}

export function stopAiNarration(): void {
  playGeneration += 1;
  stopSpeechReadAloud();
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio.load();
    } catch {
      /* ignore */
    }
    activeAudio = null;
  }
}

/**
 * تشغيل مسار السرد: Neural إن توفر، وإلا صوت الجهاز بمقاطع تدريجية بعد Prep.
 * ممنوع تمرير النص الخام المصدر دون تجهيز.
 */
export async function playAiNarration(input: {
  contentId: string;
  body: string;
  title?: string;
  rate?: number;
  mode?: ReadingMode;
  contentKind?: NarrationContentKind;
  onEnd?: () => void;
  onError?: () => void;
}): Promise<OrchestratorPlayResult> {
  stopAiNarration();
  const gen = playGeneration;
  const prepared = prepareNarrationForPlayback(input);
  if (!prepared.speakableText) {
    return {
      ok: false,
      engine: "none",
      reason: prepared.protectedSkipped ? "only_protected_text" : "empty",
      userLabel: "لا يوجد نص قابل للقراءة الصوتية",
    };
  }

  if (isNeuralTtsClientEnabled()) {
    const neural = await requestNeuralTts({
      contentId: prepared.contentId,
      segmentId: `${prepared.contentId}:full`,
      speakText: prepared.speakableText,
      ssml: prepared.ssml,
      locale: "ar-SA",
      rate: prepared.prosody.rate,
    });
    if (gen !== playGeneration) {
      return { ok: false, engine: "none", reason: "cancelled", userLabel: "أُلغيت القراءة" };
    }
    if (neural.ok) {
      try {
        const audio = new Audio(neural.audioUrl);
        activeAudio = audio;
        audio.onended = () => {
          if (activeAudio === audio) activeAudio = null;
          URL.revokeObjectURL(neural.audioUrl);
          input.onEnd?.();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(neural.audioUrl);
          const fallback = speakDevicePrepared(prepared, input);
          if (!fallback.ok) input.onError?.();
        };
        await audio.play();
        return {
          ok: true,
          engine: "azure-neural",
          userLabel: "سرد عصبي عربي",
        };
      } catch {
        /* fall through to device */
      }
    }
  }

  return speakDevicePrepared(prepared, input);
}

function speakDevicePrepared(
  prepared: OrchestratorPrepareResult,
  input: { onEnd?: () => void; onError?: () => void },
): OrchestratorPlayResult {
  if (!isSpeechReadAloudSupported()) {
    return {
      ok: false,
      engine: "none",
      reason: "device_unsupported",
      userLabel: "القراءة الصوتية غير متاحة على هذا الجهاز",
    };
  }
  const segments =
    prepared.deviceSegmentTexts.length > 0
      ? prepared.deviceSegmentTexts
      : prepared.speakableText
        ? [prepared.speakableText]
        : [];
  if (!segments.length) {
    return {
      ok: false,
      engine: "none",
      reason: "empty_after_prep",
      userLabel: "لا يوجد نص مُجهَّز للقراءة",
    };
  }
  const state = speakArabicSegments(segments, {
    rate: prepared.prosody.rate,
    gapMs: prepared.prosody.deviceGapMs,
    onEnd: input.onEnd,
    onError: input.onError,
  });
  if (state === "speaking") {
    return {
      ok: true,
      engine: "device-speech",
      userLabel: "صوت الجهاز",
    };
  }
  return {
    ok: false,
    engine: "none",
    reason: state,
    userLabel: "تعذّرت القراءة الصوتية",
  };
}

export function getNarrationEngineLabel(engine: NarrationEngine): string {
  if (engine === "azure-neural") return "سرد عصبي عربي";
  if (engine === "device-speech") return "صوت الجهاز";
  return "متوقف";
}
