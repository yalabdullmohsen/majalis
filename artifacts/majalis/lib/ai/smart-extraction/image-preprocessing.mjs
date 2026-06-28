/**
 * Image preprocessing — contrast, grayscale, sharpen (optional sharp).
 */
export async function preprocessImage({ imageBase64, mimeType = "image/jpeg" }) {
  const steps = [];
  let processedBase64 = imageBase64;
  let preprocessed = false;

  try {
    const sharp = (await import("sharp")).default;
    const input = Buffer.from(imageBase64, "base64");
    const pipeline = sharp(input)
      .rotate()
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1 })
      .modulate({ brightness: 1.05, saturation: 0.8 });

    const out = await pipeline.toBuffer();
    processedBase64 = out.toString("base64");
    preprocessed = true;
    steps.push("rotate", "grayscale", "normalize", "sharpen", "contrast_boost");
  } catch {
    steps.push("skipped_no_sharp");
  }

  return {
    imageBase64: processedBase64,
    mimeType,
    preprocessed,
    steps,
  };
}

export function detectImageComplexity({ textLength = 0, lineCount = 0, urlCount = 0 }) {
  let score = 0;
  if (textLength > 400) score += 0.2;
  if (lineCount > 12) score += 0.2;
  if (urlCount > 2) score += 0.1;
  return {
    complex: score >= 0.3,
    score,
    reason: score >= 0.3 ? "dense_layout" : "standard",
  };
}
