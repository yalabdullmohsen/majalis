/**
 * مولّد SSML عربي — لا يغيّر النص الأصلي؛ يضيف وقفات وإيقاعًا فقط.
 */

export type SsmlSegmentKind = "title" | "paragraph" | "list" | "quote" | "break";

export type SsmlSegment = {
  kind: SsmlSegmentKind;
  text: string;
};

export const SSML_VERSION = "ssml-v1";

const RATE_MAP: Record<string, string> = {
  "0.75": "-25%",
  "0.9": "-10%",
  "1": "+0%",
  "1.1": "+10%",
  "1.25": "+25%",
  "1.5": "+50%",
  "1.75": "+75%",
  "2": "+100%",
};

export function rateToSsmlPercent(rate: number): string {
  const key = String(rate);
  if (RATE_MAP[key]) return RATE_MAP[key]!;
  const pct = Math.round((rate - 1) * 100);
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct}%`;
}

/** يبني SSML للصوت العصبي — النص داخل العناصر هو نص النطق فقط. */
export function buildArabicSsml(opts: {
  segments: SsmlSegment[];
  locale?: string;
  voiceName?: string;
  rate?: number;
}): string {
  const locale = opts.locale ?? "ar-SA";
  const rate = rateToSsmlPercent(opts.rate ?? 1);
  const parts: string[] = [];
  for (const seg of opts.segments) {
    const safe = escapeSsml(seg.text.trim());
    if (!safe && seg.kind !== "break") continue;
    if (seg.kind === "title") {
      parts.push(`<p><s>${safe}</s></p><break time="600ms"/>`);
    } else if (seg.kind === "list") {
      parts.push(`<p>${safe}</p><break time="350ms"/>`);
    } else if (seg.kind === "quote") {
      parts.push(`<p><prosody rate="-5%">${safe}</prosody></p><break time="400ms"/>`);
    } else if (seg.kind === "break") {
      parts.push(`<break time="500ms"/>`);
    } else {
      parts.push(`<p>${safe}</p><break time="280ms"/>`);
    }
  }
  const voiceOpen = opts.voiceName
    ? `<voice name="${escapeSsml(opts.voiceName)}">`
    : "";
  const voiceClose = opts.voiceName ? "</voice>" : "";
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
    voiceOpen +
    `<prosody rate="${rate}">${parts.join("")}</prosody>` +
    voiceClose +
    `</speak>`
  );
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** تقسيم دلالي حتمي — لا يعيد صياغة النص. */
export function segmentEditorialText(text: string): SsmlSegment[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const blocks = cleaned.split(/\n{2,}/);
  const out: SsmlSegment[] = [];
  for (const block of blocks) {
    const t = block.trim();
    if (!t) continue;
    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0]!.length <= 80 && !/[.!?؟۔]$/.test(lines[0]!)) {
      out.push({ kind: "title", text: lines[0]! });
      continue;
    }
    for (const line of lines) {
      if (/^[-•*]\s+/.test(line) || /^\d+[\.)]\s+/.test(line)) {
        out.push({ kind: "list", text: line.replace(/^[-•*]\s+/, "").replace(/^\d+[\.)]\s+/, "") });
      } else if (/^[«"'].*[»"']$/.test(line) || line.startsWith("قال")) {
        out.push({ kind: "quote", text: line });
      } else {
        // جمل طويلة: قسّم على علامات الترقيم دون تغيير الترتيب
        const sentences = line.split(/(?<=[.!?؟۔])\s+/).filter(Boolean);
        for (const s of sentences) {
          if (s.length > 220) {
            const chunks = splitLongSentence(s);
            for (const c of chunks) out.push({ kind: "paragraph", text: c });
          } else {
            out.push({ kind: "paragraph", text: s });
          }
        }
      }
    }
    out.push({ kind: "break", text: "" });
  }
  return out.filter((s) => s.kind === "break" || s.text.trim().length > 0);
}

function splitLongSentence(sentence: string): string[] {
  const parts = sentence.split(/،\s+|;\s+/);
  if (parts.length === 1) return [sentence];
  const chunks: string[] = [];
  let buf = "";
  for (const p of parts) {
    const next = buf ? `${buf}، ${p}` : p;
    if (next.length > 180 && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

/** مطابقة حرفية لمجموع نصوص المقاطع مع الأصل بعد تنظيف الواجهة. */
export function assertSegmentsPreserveText(
  original: string,
  segments: SsmlSegment[],
): { ok: true } | { ok: false; reason: string } {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const joined = norm(
    segments
      .filter((s) => s.kind !== "break")
      .map((s) => s.text)
      .join(" "),
  );
  const base = norm(original);
  if (!base) return joined ? { ok: false, reason: "empty_source_nonempty_segments" } : { ok: true };
  // السماح بفروق المسافات فقط — رفض أي حذف/إضافة كلمات
  const baseTokens = base.split(" ").filter(Boolean);
  const joinedTokens = joined.split(" ").filter(Boolean);
  if (baseTokens.length !== joinedTokens.length) {
    return { ok: false, reason: "token_count_mismatch" };
  }
  for (let i = 0; i < baseTokens.length; i++) {
    if (baseTokens[i] !== joinedTokens[i]) {
      return { ok: false, reason: `token_mismatch_at_${i}` };
    }
  }
  return { ok: true };
}
