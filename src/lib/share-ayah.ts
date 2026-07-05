/**
 * مشاركة آية: نسخ النص أو توليد صورة مصممة بـ Canvas.
 */

export async function copyAyahText(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  const formatted = `${text} ﴿${ayahNum}﴾\n— سورة ${surahName}`;
  try {
    await navigator.clipboard.writeText(formatted);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const el = document.createElement("textarea");
      el.value = formatted;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

type ShareImageOptions = {
  text: string;
  surahName: string;
  ayahNum: number;
  surahNum: number;
};

export async function generateAyahImage(opts: ShareImageOptions): Promise<string> {
  const { text, surahName, ayahNum } = opts;
  const W = 900, H = 600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   "#0d3527");
  bg.addColorStop(0.5, "#164E3C");
  bg.addColorStop(1,   "#0d3527");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Gold border ──
  ctx.strokeStyle = "rgba(14,110,82,0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = "rgba(14,110,82,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Corner ornaments (simple crosses) ──
  const corners = [[40,40],[W-40,40],[40,H-40],[W-40,H-40]] as const;
  ctx.strokeStyle = "rgba(14,110,82,0.7)";
  ctx.lineWidth = 1.5;
  for (const [cx,cy] of corners) {
    ctx.beginPath(); ctx.moveTo(cx-10,cy); ctx.lineTo(cx+10,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-10); ctx.lineTo(cx,cy+10); ctx.stroke();
  }

  // ── Ayah text (RTL) ──
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5f0e8";

  const maxWidth = W - 100;
  const lineHeight = 62;
  const startY = H / 2 - 40;
  const fontSize = text.length > 120 ? 28 : text.length > 70 ? 34 : 40;

  ctx.font = `${fontSize}px "Amiri Quran", "KFGQPC Uthmanic Script", "Scheherazade New", serif`;
  wrapText(ctx, text, W / 2, startY, maxWidth, lineHeight);

  // ── Ayah number ──
  ctx.font = `bold 22px "Cairo", "Tajawal", sans-serif`;
  ctx.fillStyle = "rgba(14,110,82,0.9)";
  const surahLine = `سورة ${surahName} ﴿${ayahNum}﴾`;
  ctx.fillText(surahLine, W / 2, H - 80);

  // ── Site watermark ──
  ctx.font = `14px "Cairo", "Tajawal", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("المجلس العلمي", W / 2, H - 45);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(" ");
  let line = "";
  let y = startY;

  for (const word of words) {
    const test = line ? `${word} ${line}` : word; // RTL: words go right-to-left
    const measured = ctx.measureText(test).width;
    if (measured > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

export async function shareAyahAsImage(opts: ShareImageOptions): Promise<void> {
  const dataUrl = await generateAyahImage(opts);

  // Try Web Share API with file
  if (navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ayah-${opts.surahNum}-${opts.ayahNum}.png`, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `آية ${opts.ayahNum} — سورة ${opts.surahName}` });
        return;
      }
    } catch { /* fallback to download */ }
  }

  // Fallback: download the image
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `ayah-${opts.surahNum}-${opts.ayahNum}.png`;
  a.click();
}
