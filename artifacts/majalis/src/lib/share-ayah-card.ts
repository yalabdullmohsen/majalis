/**
 * مولّد بطاقات مشاركة الآية — خلفيات متعددة + ترجمة/تفسير اختياري + PNG/WebP.
 */
import { withEphemeralCanvas } from "@/lib/canvas-gl-cleanup";

export type ShareCardTheme = "emerald-gradient" | "minimal-dark" | "parchment" | "geometric";

export type ShareCardOptions = {
  text: string;
  surahName: string;
  ayahNum: number;
  surahNum: number;
  theme?: ShareCardTheme;
  /** ترجمة أو مقطع تفسير قصير أسفل الآية */
  subtitle?: string | null;
  format?: "png" | "webp";
  quality?: number;
};

export const SHARE_CARD_THEMES: { id: ShareCardTheme; label: string }[] = [
  { id: "emerald-gradient", label: "تدرّج زمردي" },
  { id: "minimal-dark", label: "داكن بسيط" },
  { id: "parchment", label: "رقّ دافئ" },
  { id: "geometric", label: "زخرفة هندسية" },
];

function paintBackground(ctx: CanvasRenderingContext2D, theme: ShareCardTheme, W: number, H: number) {
  if (theme === "minimal-dark") {
    ctx.fillStyle = "#0a0c0f";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(94,196,154,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    return;
  }
  if (theme === "parchment") {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#f3e6cf");
    bg.addColorStop(0.5, "#ebe0c8");
    bg.addColorStop(1, "#e2d2b4");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(120, 90, 40, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, W - 44, H - 44);
    return;
  }
  if (theme === "geometric") {
    ctx.fillStyle = "#102820";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(176,141,46,0.28)";
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = 0; x < W + H; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - H, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-x, 0);
      ctx.lineTo(-x + H, H);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(13, 40, 32, 0.72)";
    ctx.fillRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = "rgba(176,141,46,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    return;
  }
  // emerald-gradient (default)
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d3527");
  bg.addColorStop(0.5, "#164E3C");
  bg.addColorStop(1, "#0d3527");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(176,141,46,0.45)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = "rgba(176,141,46,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);
}

function inkFor(theme: ShareCardTheme): { ayah: string; meta: string; watermark: string } {
  if (theme === "parchment") {
    return { ayah: "#1a2e1c", meta: "#5c4a28", watermark: "rgba(60,45,20,0.4)" };
  }
  return { ayah: "#f5f0e8", meta: "rgba(232,213,176,0.9)", watermark: "rgba(255,255,255,0.35)" };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line ? `${word} ${line}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

export async function generateAyahImage(opts: ShareCardOptions): Promise<string> {
  const theme = opts.theme ?? "emerald-gradient";
  const format = opts.format ?? "png";
  const quality = opts.quality ?? 0.92;
  const { text, surahName, ayahNum, subtitle } = opts;
  const W = 900;
  const H = subtitle ? 720 : 600;
  const ink = inkFor(theme);

  return withEphemeralCanvas(W, H, (canvas, ctx) => {
    paintBackground(ctx, theme, W, H);

    ctx.save();
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = ink.ayah;

    const maxWidth = W - 110;
    const lineHeight = 58;
    const fontSize = text.length > 120 ? 26 : text.length > 70 ? 32 : 38;
    ctx.font = `${fontSize}px "Amiri Quran", "KFGQPC Uthmanic Script", "Scheherazade New", serif`;
    const startY = subtitle ? H * 0.28 : H / 2 - 36;
    const endY = wrapText(ctx, text, W / 2, startY, maxWidth, lineHeight);

    if (subtitle?.trim()) {
      ctx.font = `18px "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif`;
      ctx.fillStyle = ink.meta;
      wrapText(ctx, subtitle.trim().slice(0, 280), W / 2, endY + 48, maxWidth, 28);
    }

    ctx.font = `bold 20px "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif`;
    ctx.fillStyle = ink.meta;
    ctx.fillText(`سورة ${surahName} ﴿${ayahNum}﴾`, W / 2, H - 78);

    ctx.font = `13px "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif`;
    ctx.fillStyle = ink.watermark;
    ctx.fillText("المجلس العلمي · Majlisilm", W / 2, H - 42);
    ctx.restore();

    if (format === "webp") {
      try {
        return canvas.toDataURL("image/webp", quality);
      } catch {
        return canvas.toDataURL("image/png");
      }
    }
    return canvas.toDataURL("image/png");
  });
}

export async function shareAyahAsImage(opts: ShareCardOptions): Promise<void> {
  const dataUrl = await generateAyahImage(opts);
  const ext = opts.format === "webp" ? "webp" : "png";
  const mime = opts.format === "webp" ? "image/webp" : "image/png";

  if (navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ayah-${opts.surahNum}-${opts.ayahNum}.${ext}`, { type: mime });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `آية ${opts.ayahNum} — سورة ${opts.surahName}`,
          text: `${opts.text}\n— سورة ${opts.surahName} ﴿${opts.ayahNum}﴾`,
        });
        return;
      }
    } catch {
      /* fallback download */
    }
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `ayah-${opts.surahNum}-${opts.ayahNum}.${ext}`;
  a.click();
}

/** توافق خلفي مع الاستدعاءات القديمة. */
export async function shareAyahAsImageLegacy(opts: {
  text: string;
  surahName: string;
  ayahNum: number;
  surahNum: number;
}): Promise<void> {
  return shareAyahAsImage(opts);
}
