/**
 * POST /api/narration/tts — Azure Neural TTS (server-side keys only).
 * Brand: سُنّة. Never logs full narration text.
 */
import { sendJson } from "../api/_http.mjs";

const MAX_CHARS = 4500;
const QURAN_MARKERS = [/﴿[^﴾]+﴾/, /\[سورة\s+[^\]]+\]/, /Quran\s*\d+:\d+/i];

function getAzureConfig() {
  const key = String(process.env.AZURE_SPEECH_KEY || process.env.AZURE_TTS_KEY || "").trim();
  const region = String(
    process.env.AZURE_SPEECH_REGION || process.env.AZURE_TTS_REGION || "",
  ).trim();
  return { key, region, ready: Boolean(key && region) };
}

function containsProtected(text) {
  return QURAN_MARKERS.some((re) => re.test(text));
}

function rateToSsml(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n === 1) return "+0%";
  const pct = Math.round((n - 1) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function buildSsml({ text, ssml, locale, voiceId, rate }) {
  if (ssml && String(ssml).includes("<speak")) return String(ssml);
  const safe = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const voice = voiceId || "ar-SA-ZariyahNeural";
  const lang = locale || "ar-SA";
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody rate="${rateToSsml(rate)}">${safe}</prosody></voice></speak>`
  );
}

export default async function handler(req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    const { ready } = getAzureConfig();
    sendJson(res, 200, {
      ok: true,
      service: "narration-tts",
      neuralReady: ready,
      brand: "سُنّة",
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, reason: "method_not_allowed" });
    return;
  }

  const { key, region, ready } = getAzureConfig();
  if (!ready) {
    sendJson(res, 503, {
      ok: false,
      reason: "neural_provider_not_configured",
      fallbackToDevice: true,
    });
    return;
  }

  const body = req.body || {};
  const speakText = String(body.speakText || "").trim();
  const contentId = String(body.contentId || "").slice(0, 120);
  const segmentId = String(body.segmentId || "").slice(0, 120);

  if (!speakText) {
    sendJson(res, 400, { ok: false, reason: "empty_text", fallbackToDevice: true });
    return;
  }
  if (speakText.length > MAX_CHARS) {
    sendJson(res, 413, { ok: false, reason: "text_too_long", fallbackToDevice: true });
    return;
  }
  if (containsProtected(speakText) || containsProtected(String(body.ssml || ""))) {
    console.info(
      JSON.stringify({
        level: "info",
        msg: "narration.tts.protected_refused",
        contentId,
        segmentId,
        ts: new Date().toISOString(),
      }),
    );
    sendJson(res, 422, { ok: false, reason: "protected_text", fallbackToDevice: true });
    return;
  }

  const ssml = buildSsml({
    text: speakText,
    ssml: body.ssml,
    locale: body.locale || "ar-SA",
    voiceId: body.voiceId || "ar-SA-ZariyahNeural",
    rate: body.rate ?? 1,
  });

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  let azureRes;
  try {
    azureRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "SunnahNarration/1.0",
      },
      body: ssml,
      signal: AbortSignal.timeout(14_000),
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "narration.tts.network_failed",
        contentId,
        segmentId,
        error: String(err?.message || err).slice(0, 160),
        ts: new Date().toISOString(),
      }),
    );
    sendJson(res, 503, { ok: false, reason: "provider_timeout", fallbackToDevice: true });
    return;
  }

  if (!azureRes.ok) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "narration.tts.provider_error",
        contentId,
        segmentId,
        status: azureRes.status,
        ts: new Date().toISOString(),
      }),
    );
    sendJson(res, 502, {
      ok: false,
      reason: `provider_${azureRes.status}`,
      fallbackToDevice: true,
    });
    return;
  }

  const buf = Buffer.from(await azureRes.arrayBuffer());
  if (!buf.length) {
    sendJson(res, 502, { ok: false, reason: "empty_audio", fallbackToDevice: true });
    return;
  }

  console.info(
    JSON.stringify({
      level: "info",
      msg: "narration.tts.ok",
      contentId,
      segmentId,
      bytes: buf.length,
      ts: new Date().toISOString(),
    }),
  );

  if (res.headersSent || res.writableEnded) return;
  res.statusCode = 200;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "private, max-age=0, no-store");
  res.setHeader("X-Sunnah-Narration-Engine", "azure-neural");
  res.end(buf);
}
