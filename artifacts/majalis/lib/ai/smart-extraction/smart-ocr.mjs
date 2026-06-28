/**
 * Smart OCR — preprocessing + text extraction + entity hints.
 */
import { preprocessImage } from "./image-preprocessing.mjs";
import { extractEntitiesFromArabicText } from "../local-ocr.mjs";

async function tryTesseract(imageBase64, preprocessed = false) {
  const enabled = String(process.env.LOCAL_OCR_ENABLED || "").toLowerCase();
  if (enabled !== "1" && enabled !== "true") return null;

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("ara");
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(Buffer.from(imageBase64, "base64"));
    await worker.terminate();
    return {
      text: data?.text || "",
      confidence: (data?.confidence || 0) / 100,
      preprocessed,
    };
  } catch {
    return null;
  }
}

function detectTableLike(text) {
  const lines = text.split(/\n/).filter((l) => l.trim());
  const pipeRows = lines.filter((l) => (l.match(/\|/g) || []).length >= 2).length;
  return pipeRows >= 2 || lines.some((l) => /\t/.test(l));
}

function detectLogos(text) {
  return /(?:شعار|logo|وزارة|جمعية|مؤسسة)/iu.test(text);
}

export async function runSmartOcr({ imageBase64, mimeType = "image/jpeg", notes, sourceUrl }) {
  const started = Date.now();
  let text = String(notes || "").trim();
  let ocrSource = notes ? "admin_notes" : null;
  let ocrConfidence = notes ? 0.9 : 0;
  let preprocessing = { preprocessed: false, steps: [] };

  if (imageBase64) {
    preprocessing = await preprocessImage({ imageBase64, mimeType });
    const tess = await tryTesseract(preprocessing.imageBase64, preprocessing.preprocessed);
    if (tess?.text?.trim()) {
      text = tess.text.trim();
      ocrSource = "tesseract";
      ocrConfidence = tess.confidence || 0.5;
    }
  }

  if (!text && imageBase64 && !notes) {
    return {
      ok: false,
      reason: "ocr_no_text",
      text: "",
      durationMs: Date.now() - started,
      preprocessing,
    };
  }

  if (!text) {
    return { ok: false, reason: "no_input", text: "", durationMs: Date.now() - started, preprocessing };
  }

  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const lines = text.split(/\n/).filter((l) => l.trim());

  return {
    ok: true,
    text,
    ocrSource: ocrSource || "text_input",
    ocrConfidence,
    preprocessing,
    features: {
      hasTable: detectTableLike(text),
      hasLogoHint: detectLogos(text),
      phoneDetected: /(?:\+965|965)?[\s-]?\d{4}[\s-]?\d{4}/.test(text),
      qrHint: /qr|باركود|scan/i.test(text),
      dateDetected: /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text),
      timeDetected: /\d{1,2}\s*(?:ص|م)|بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء)/.test(text),
      mosqueDetected: /(?:مسجد|جامع)/u.test(text),
      cityDetected: /(?:العاصمة|حولي|الفروانية|الأحمدي|الجهراء|مبارك)/u.test(text),
      urlCount: urls.length,
      lineCount: lines.length,
      charCount: text.length,
    },
    durationMs: Date.now() - started,
    hints: extractEntitiesFromArabicText(text),
  };
}
