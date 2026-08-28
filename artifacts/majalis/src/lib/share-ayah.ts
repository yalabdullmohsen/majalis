/**
 * مشاركة آية: نسخ النص أو توليد صورة مصممة بـ Canvas.
 */

async function copyPlainText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const el = document.createElement("textarea");
      el.value = text;
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

export async function copyAyahText(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  return copyPlainText(`${text} ﴿${ayahNum}﴾\n— سورة ${surahName}`);
}

/** نسخ الآية مع تفسيرها المنقول حرفياً من المصدر المعتمد. */
export async function copyAyahWithTafsir(
  ayahText: string,
  surahName: string,
  ayahNum: number,
  tafsirText: string,
  tafsirLabel: string,
): Promise<boolean> {
  const body = [
    `${ayahText} ﴿${ayahNum}﴾`,
    `— سورة ${surahName}`,
    "",
    `${tafsirLabel}:`,
    tafsirText.trim(),
  ].join("\n");
  return copyPlainText(body);
}

export async function shareAyahWithTafsir(
  ayahText: string,
  surahName: string,
  ayahNum: number,
  tafsirText: string,
  tafsirLabel: string,
): Promise<boolean> {
  const message = [
    `آية من القرآن الكريم:`,
    `${ayahText} ﴿${ayahNum}﴾`,
    `— سورة ${surahName}`,
    "",
    `${tafsirLabel}:`,
    tafsirText.trim(),
  ].join("\n");
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: message, title: `${tafsirLabel} — سورة ${surahName}` });
      return true;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return false;
    }
  }
  return copyPlainText(message);
}

/**
 * إزالة التشكيل فقط (الحركات، السكون، التنوين، المدّ...) دون أي تعديل آخر
 * على الحروف نفسها (لا توحيد للهمزات، لا حذف ألف خنجرية) — نسخة "قراءة
 * بلا تشكيل" أمينة للرسم العثماني الأصلي، لا نسخة مطبَّعة للمطابقة (تلك
 * موجودة بغرض مختلف تمامًا في src/lib/recitation-ai/quran-normalize.ts
 * ولا تصلح هنا لأنها تُوحِّد أشكال الهمزة وتُسقط الألف الخنجرية — تغييرات
 * لا يريدها مستخدم يطلب فقط "بلا تشكيل").
 */
export function stripArabicDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g, "");
}

export async function copyAyahTextPlain(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  return copyPlainText(`${stripArabicDiacritics(text)} ﴿${ayahNum}﴾\n— سورة ${surahName}`);
}

export async function shareAyahAsText(text: string, surahName: string, ayahNum: number): Promise<boolean> {
  const result = await shareVerse(text, { surahName, ayahNum });
  return result.shared;
}

export type ShareVerseResult = {
  /** True when the verse was shared natively or copied as fallback. */
  shared: boolean;
  method: "native" | "clipboard" | "cancelled" | "failed";
};

/**
 * Web port of RN `Share.share({ message: \`آية من القرآن الكريم: ${verseText}\` })`.
 * Uses `navigator.share` when available, otherwise copies to the clipboard.
 */
export async function shareVerse(
  verseText: string,
  opts?: { surahName?: string; ayahNum?: number },
): Promise<ShareVerseResult> {
  const trimmed = verseText.trim();
  if (!trimmed) return { shared: false, method: "failed" };

  const message =
    opts?.surahName && opts?.ayahNum != null
      ? `آية من القرآن الكريم:\n${trimmed} ﴿${opts.ayahNum}﴾\n— سورة ${opts.surahName}`
      : `آية من القرآن الكريم: ${trimmed}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        text: message,
        title: opts?.surahName
          ? `آية ${opts.ayahNum ?? ""} — سورة ${opts.surahName}`.trim()
          : "آية من القرآن الكريم",
      });
      return { shared: true, method: "native" };
    } catch (error) {
      // AbortError = user dismissed the sheet (RN Share.dismissedAction)
      if (error instanceof DOMException && error.name === "AbortError") {
        return { shared: false, method: "cancelled" };
      }
      console.error("خطأ في المشاركة:", error instanceof Error ? error.message : error);
    }
  }

  const copied = await copyPlainText(message);
  return { shared: copied, method: copied ? "clipboard" : "failed" };
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
  const { withEphemeralCanvas } = await import("@/lib/canvas-gl-cleanup");
  return withEphemeralCanvas(W, H, (canvas, ctx) => {
    // ورق عثماني كريمي دافئ
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#fdfbf7");
    bg.addColorStop(0.55, "#faf7f0");
    bg.addColorStop(1, "#efe6d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#a68b67";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = "rgba(166, 139, 103, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    const corners = [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]] as const;
    ctx.strokeStyle = "#135034";
    ctx.lineWidth = 1.5;
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
    }

    ctx.save();
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = "#111111";

    const maxWidth = W - 100;
    const lineHeight = 62;
    const startY = H / 2 - 40;
    const fontSize = text.length > 120 ? 28 : text.length > 70 ? 34 : 40;

    ctx.font = `${fontSize}px "Amiri Quran", "KFGQPC Uthmanic Script", "Scheherazade New", serif`;
    wrapText(ctx, text, W / 2, startY, maxWidth, lineHeight);

    ctx.font = `bold 22px "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif`;
    ctx.fillStyle = "#135034";
    ctx.fillText(`سورة ${surahName} ﴿${ayahNum}﴾`, W / 2, H - 80);

    ctx.font = `14px "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif`;
    ctx.fillStyle = "#4a4a4a";
    ctx.fillText("سُنّة", W / 2, H - 45);
    ctx.restore();

    return canvas.toDataURL("image/png");
  });
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
