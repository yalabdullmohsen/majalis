/**
 * AIReaderOrchestrator — مسار السرد العربي لسُنّة.
 * الذكاء يحسّن النطق والتقسيم فقط؛ لا يعيد كتابة المحتوى الشرعي.
 */

import { partitionProtectedText } from "@/lib/audio-reader/protected-text";
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
  speakArabicText,
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

/** يستخرج نصًا قابلًا للقراءة مع عزل المحمي. */
export function prepareNarrationForPlayback(input: {
  contentId: string;
  body: string;
  title?: string;
  rate?: number;
}): OrchestratorPrepareResult {
  const displayText = [input.title, input.body].filter(Boolean).join("\n\n");
  const cleaned = stripNoise(displayText);
  const pieces = partitionProtectedText(cleaned);
  const speakableParts = pieces
    .filter((p) => p.type === "speakable")
    .map((p) => p.text.trim())
    .filter(Boolean);
  const protectedSkipped = pieces.filter((p) => p.type === "protected").length;
  const speakableJoined = speakableParts.join("\n\n");
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
    rate: input.rate ?? 1,
  });
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
 * تشغيل مسار السرد: Neural إن توفر، وإلا صوت الجهاز مع تسمية صادقة.
 */
export async function playAiNarration(input: {
  contentId: string;
  body: string;
  title?: string;
  rate?: number;
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
      rate: input.rate ?? 1,
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
          const fallback = speakDevice(prepared.speakableText, input);
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

  return speakDevice(prepared.speakableText, input);
}

function speakDevice(
  text: string,
  input: { rate?: number; onEnd?: () => void; onError?: () => void },
): OrchestratorPlayResult {
  if (!isSpeechReadAloudSupported()) {
    return {
      ok: false,
      engine: "none",
      reason: "device_unsupported",
      userLabel: "القراءة الصوتية غير متاحة على هذا الجهاز",
    };
  }
  const state = speakArabicText(text, {
    rate: input.rate ?? 0.95,
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
