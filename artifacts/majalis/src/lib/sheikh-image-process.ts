import { resolveSheikhFocalPoint, type SheikhFocalPoint } from "@/lib/sheikh-image-focal";

export type SheikhImageVariant = "avatar" | "portrait";

export type ProcessedSheikhImage = {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  processed: boolean;
};

type CacheEntry = ProcessedSheikhImage & { blobUrls: string[] };

const CACHE = new Map<string, CacheEntry>();
const CACHE_MAX = 48;
const FALLBACK_LOGO = "/logo.png";

const BG_TOP = "#F3EBD8";
const BG_BOTTOM = "#FAF6EE";
const BRAND_BORDER = "#C8A24A";

function cacheKey(src: string, variant: SheikhImageVariant, size: number, dpr: number) {
  return `${src}|${variant}|${size}|${dpr}`;
}

function revokeEntry(entry: CacheEntry) {
  for (const url of entry.blobUrls) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
}

function trimCache() {
  while (CACHE.size > CACHE_MAX) {
    const first = CACHE.keys().next().value;
    if (!first) break;
    const entry = CACHE.get(first);
    if (entry) revokeEntry(entry);
    CACHE.delete(first);
  }
}

export function isSheikhFallbackLogo(src?: string | null): boolean {
  if (!src) return true;
  return src.includes("logo.png") || src.includes("logo-icon");
}

export function canProcessSheikhImage(src?: string | null): boolean {
  if (!src || isSheikhFallbackLogo(src)) return false;
  if (src.startsWith("/")) return true;
  if (typeof window !== "undefined" && src.startsWith(window.location.origin)) return true;
  return false;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    if (canProcessSheikhImage(src)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sheikh image: ${src}`));
    img.src = src;
  });
}

type Bounds = { left: number; top: number; right: number; bottom: number };

function sampleBackground(imageData: ImageData): [number, number, number] {
  const { data, width, height } = imageData;
  const points = [
    0,
    width - 1,
    (height - 1) * width,
    (height - 1) * width + width - 1,
    Math.floor(width / 2),
    width * Math.floor(height / 2) + Math.floor(width / 2),
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const idx of points) {
    const i = idx * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = points.length;
  return [r / n, g / n, b / n];
}

function colorDistance(r: number, g: number, b: number, br: number, bg: number, bb: number) {
  const dr = r - br;
  const dg = g - bg;
  const db = b - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function detectContentBounds(imageData: ImageData, threshold = 28): Bounds {
  const { data, width, height } = imageData;
  const [br, bg, bb] = sampleBackground(imageData);

  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  let found = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 16) continue;
      const dist = colorDistance(data[i], data[i + 1], data[i + 2], br, bg, bb);
      if (dist < threshold) continue;
      found = true;
      if (x < left) left = x;
      if (y < top) top = y;
      if (x > right) right = x;
      if (y > bottom) bottom = y;
    }
  }

  if (!found) {
    return { left: 0, top: 0, right: width - 1, bottom: height - 1 };
  }

  const padX = Math.round((right - left) * 0.06);
  const padY = Math.round((bottom - top) * 0.08);
  return {
    left: Math.max(0, left - padX),
    top: Math.max(0, top - padY),
    right: Math.min(width - 1, right + padX),
    bottom: Math.min(height - 1, bottom + padY),
  };
}

function drawBrandBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, BG_TOP);
  gradient.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawBlurredBackdrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.filter = "blur(18px) saturate(0.85) brightness(1.05)";
  ctx.globalAlpha = 0.35;
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * 1.15;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  ctx.restore();
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bounds: Bounds,
  width: number,
  height: number,
  focal: SheikhFocalPoint,
) {
  const cropW = bounds.right - bounds.left + 1;
  const cropH = bounds.bottom - bounds.top + 1;
  const scaleBoost = focal.scale ?? 1.02;
  const scale = Math.max(width / cropW, height / cropH) * scaleBoost;
  const drawW = cropW * scale;
  const drawH = cropH * scale;

  const focalX = bounds.left + cropW * (focal.x / 100);
  const focalY = bounds.top + cropH * (focal.y / 100);
  const drawX = width * (focal.x / 100) - (focalX - bounds.left) * scale;
  const drawY = height * (focal.y / 100) - (focalY - bounds.top) * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.filter = "contrast(1.07) brightness(1.03) saturate(1.04)";
  ctx.drawImage(img, bounds.left, bounds.top, cropW, cropH, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      quality,
    );
  });
}

async function renderProcessed(
  img: HTMLImageElement,
  variant: SheikhImageVariant,
  outputSize: number,
  dpr: number,
  focal: SheikhFocalPoint,
): Promise<{ url: string; width: number; height: number }> {
  const aspect = variant === "avatar" ? 1 : 4 / 5;
  const outW = Math.round(outputSize * dpr);
  const outH = Math.round(outputSize / aspect * dpr);

  const maxSide = Math.min(1200, Math.max(img.naturalWidth, img.naturalHeight));
  const sampleScale = maxSide / Math.max(img.naturalWidth, img.naturalHeight);
  const sampleW = Math.max(1, Math.round(img.naturalWidth * sampleScale));
  const sampleH = Math.max(1, Math.round(img.naturalHeight * sampleScale));

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) throw new Error("Canvas unavailable");
  sampleCtx.drawImage(img, 0, 0, sampleW, sampleH);
  const bounds = detectContentBounds(sampleCtx.getImageData(0, 0, sampleW, sampleH));
  const scaledBounds: Bounds = {
    left: Math.round(bounds.left / sampleScale),
    top: Math.round(bounds.top / sampleScale),
    right: Math.round(bounds.right / sampleScale),
    bottom: Math.round(bounds.bottom / sampleScale),
  };

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  drawBrandBackground(ctx, outW, outH);
  drawBlurredBackdrop(ctx, img, outW, outH);
  drawSubject(ctx, img, scaledBounds, outW, outH, focal);

  const blob = await canvasToBlob(canvas);
  return { url: URL.createObjectURL(blob), width: outW, height: outH };
}

export async function processSheikhImage(options: {
  src: string;
  variant?: SheikhImageVariant;
  outputSize?: number;
  devicePixelRatio?: number;
}): Promise<ProcessedSheikhImage> {
  const {
    src,
    variant = "avatar",
    outputSize = 128,
    devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  } = options;

  const normalized = src.trim() || FALLBACK_LOGO;
  if (isSheikhFallbackLogo(normalized) || !canProcessSheikhImage(normalized)) {
    const aspect = variant === "avatar" ? 1 : 4 / 5;
    return {
      src: normalized,
      width: outputSize,
      height: Math.round(outputSize / aspect),
      processed: false,
    };
  }

  const dpr = Math.min(Math.max(devicePixelRatio, 1), 2);
  const key = cacheKey(normalized, variant, outputSize, dpr);
  const cached = CACHE.get(key);
  if (cached) {
    return {
      src: cached.src,
      srcSet: cached.srcSet,
      width: cached.width,
      height: cached.height,
      processed: cached.processed,
    };
  }

  try {
    const img = await loadImage(normalized);
    const focal = resolveSheikhFocalPoint(normalized);
    const primaryDpr = dpr;
    const primary = await renderProcessed(img, variant, outputSize, primaryDpr, focal);

    let srcSet: string | undefined;
    const blobUrls = [primary.url];

    if (primaryDpr > 1) {
      const oneX = await renderProcessed(img, variant, outputSize, 1, focal);
      blobUrls.push(oneX.url);
      srcSet = `${oneX.url} 1x, ${primary.url} 2x`;
    }

    const entry: CacheEntry = {
      src: primary.url,
      srcSet,
      width: Math.round(outputSize),
      height: variant === "avatar" ? Math.round(outputSize) : Math.round(outputSize / (4 / 5)),
      processed: true,
      blobUrls,
    };

    CACHE.set(key, entry);
    trimCache();

    return {
      src: entry.src,
      srcSet: entry.srcSet,
      width: entry.width,
      height: entry.height,
      processed: entry.processed,
    };
  } catch {
    const aspect = variant === "avatar" ? 1 : 4 / 5;
    return {
      src: normalized,
      width: outputSize,
      height: Math.round(outputSize / aspect),
      processed: false,
    };
  }
}

export { BRAND_BORDER, FALLBACK_LOGO };
