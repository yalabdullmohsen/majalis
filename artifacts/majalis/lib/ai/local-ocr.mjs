/**
 * Simple local OCR / heuristic text extraction (no external API).
 * Uses admin notes when available; optional Tesseract when LOCAL_OCR_ENABLED=1.
 */

function extractEntitiesFromArabicText(text) {
  const t = String(text || "");
  const parsed = {
    title: "",
    speaker_name: "",
    mosque: "",
    region: "",
    city: "",
    gregorian_date: "",
    day_of_week: "",
    lesson_time: "",
    phone: "",
    registration_url: "",
    live_url: "",
    category: "",
    activity_type: "درس",
    language: "ar",
    source: "local_ocr",
    confidence: 0,
    raw_ocr_text: t,
  };

  const sheikh = t.match(/(?:الشيخ|فضيلة|د\.|دكتور|العلامة)\s+[^\n،,]{3,50}/)?.[0];
  if (sheikh) parsed.speaker_name = sheikh.replace(/^(الشيخ|فضيلة|د\.|دكتور|العلامة)\s*/, "").trim();

  const mosque = t.match(/(?:مسجد|جامع|مصلى)\s+[^\n،,]{3,50}/)?.[0];
  if (mosque) parsed.mosque = mosque.trim();

  const region = t.match(/(?:منطقة|حي|ضاحية)\s+[^\n،,]{3,40}/)?.[0];
  if (region) parsed.region = region.replace(/^(منطقة|حي|ضاحية)\s*/, "").trim();

  const time = t.match(/\d{1,2}[:.]?\d{0,2}\s*(?:ص|م)|بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء)/)?.[0];
  if (time) parsed.lesson_time = time.trim();

  const date = t.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/)?.[0];
  if (date) parsed.gregorian_date = date.replace(/\//g, "-");

  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  for (const d of days) {
    if (t.includes(d)) {
      parsed.day_of_week = d;
      break;
    }
  }

  const phone = t.match(/(?:\+965|00965|965)?[\s-]?\d{4}[\s-]?\d{4}/)?.[0];
  if (phone) parsed.phone = phone.replace(/\s/g, "");

  const urls = t.match(/https?:\/\/[^\s]+/g) || [];
  if (urls[0]) parsed.registration_url = urls[0];
  if (urls[1]) parsed.live_url = urls[1];

  const categories = [
    ["تفسير", "تفسير"],
    ["فقه", "فقه"],
    ["عقيدة", "عقيدة"],
    ["حديث", "حديث"],
    ["سيرة", "سيرة"],
    ["تجويد", "تجويد"],
    ["قرآن", "تفسير"],
  ];
  for (const [kw, cat] of categories) {
    if (t.includes(kw)) {
      parsed.category = cat;
      break;
    }
  }

  if (/دورة|course/i.test(t)) parsed.activity_type = "دورة";
  if (/محاضرة|lecture/i.test(t)) parsed.activity_type = "محاضرة";

  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines[0] && lines[0].length > 5 && !parsed.title) {
    parsed.title = lines[0].slice(0, 120);
  }

  const gov = ["العاصمة", "حولي", "الفروانية", "الأحمدي", "الجهراء", "مبارك الكبير"];
  for (const g of gov) {
    if (t.includes(g)) {
      parsed.city = g;
      break;
    }
  }
  if (!parsed.city && /الكويت/.test(t)) parsed.city = "الكويت";

  const signals = [parsed.title, parsed.speaker_name, parsed.mosque, parsed.lesson_time, parsed.gregorian_date].filter(Boolean);
  parsed.confidence = signals.length >= 3 ? 0.45 : signals.length >= 1 ? 0.25 : 0.1;

  return parsed;
}

async function tryTesseract(imageBase64) {
  const enabled = String(process.env.LOCAL_OCR_ENABLED || "").toLowerCase();
  if (enabled !== "1" && enabled !== "true") return null;

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("ara");
    const { data } = await worker.recognize(Buffer.from(imageBase64, "base64"));
    await worker.terminate();
    return data?.text || "";
  } catch {
    return null;
  }
}

export async function runLocalOcr({ imageBase64, mimeType, notes, sourceUrl }) {
  void mimeType;
  void sourceUrl;

  let text = String(notes || "").trim();

  if (!text && imageBase64) {
    const tess = await tryTesseract(imageBase64);
    if (tess) text = tess;
  }

  if (!text) {
    return { ok: false, reason: "no_local_ocr" };
  }

  const parsed = extractEntitiesFromArabicText(text);
  const hasSignal = Boolean(parsed.title || parsed.speaker_name || parsed.mosque || text.length > 30);

  return {
    ok: hasSignal,
    parsed,
    text,
    confidence: hasSignal ? Math.min(0.45, 0.2 + text.length / 800) : 0.1,
  };
}

export { extractEntitiesFromArabicText };
