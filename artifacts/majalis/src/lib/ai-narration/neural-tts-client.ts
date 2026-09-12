/**
 * عميل Neural TTS — يستدعي خادم سُنّة فقط؛ لا مفاتيح في العميل.
 */

export type NeuralTtsRequest = {
  contentId: string;
  segmentId: string;
  /** نص نطق مُجهَّز — بدون آيات محمية */
  speakText: string;
  ssml?: string;
  locale?: string;
  rate?: number;
  voiceId?: string;
};

export type NeuralTtsResult =
  | { ok: true; audioUrl: string; provider: "azure-neural"; voiceId: string; locale: string }
  | { ok: false; reason: string; fallbackToDevice: true };

const NEURAL_ENDPOINT = "/api/narration/tts";

export function isNeuralTtsClientEnabled(): boolean {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (env?.VITE_NEURAL_TTS_ENABLED === "true") return true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("sunnah.neuralTts") === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function requestNeuralTts(req: NeuralTtsRequest): Promise<NeuralTtsResult> {
  if (!isNeuralTtsClientEnabled()) {
    return { ok: false, reason: "neural_client_disabled", fallbackToDevice: true };
  }
  if (!req.speakText.trim()) {
    return { ok: false, reason: "empty_text", fallbackToDevice: true };
  }
  try {
    const res = await fetch(NEURAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/mpeg, application/json" },
      body: JSON.stringify({
        contentId: req.contentId,
        segmentId: req.segmentId,
        // لا نرسل نصًا كاملاً في سجلات العميل — الجسم للخادم فقط
        speakText: req.speakText.slice(0, 4500),
        ssml: req.ssml?.slice(0, 8000),
        locale: req.locale ?? "ar-SA",
        rate: req.rate ?? 1,
        voiceId: req.voiceId ?? "ar-SA-ZariyahNeural",
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 503 || res.status === 501) {
      return { ok: false, reason: "provider_unavailable", fallbackToDevice: true };
    }
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}`, fallbackToDevice: true };
    }
    const ctype = res.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const json = (await res.json()) as { ok?: boolean; reason?: string };
      return {
        ok: false,
        reason: json.reason || "json_refusal",
        fallbackToDevice: true,
      };
    }
    const blob = await res.blob();
    if (!blob.size) {
      return { ok: false, reason: "empty_audio", fallbackToDevice: true };
    }
    const audioUrl = URL.createObjectURL(blob);
    return {
      ok: true,
      audioUrl,
      provider: "azure-neural",
      voiceId: req.voiceId ?? "ar-SA-ZariyahNeural",
      locale: req.locale ?? "ar-SA",
    };
  } catch {
    return { ok: false, reason: "network_or_timeout", fallbackToDevice: true };
  }
}
