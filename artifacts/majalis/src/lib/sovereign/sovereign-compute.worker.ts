/**
 * Worker حسابات ثقيلة: تطبيع دفعي، بحث نصّي مسطّح، تنسيق هجري خفيف.
 */
import { normalizeArabic, stripArabicDiacritics } from "@/shared/arabic-normalize";

type PlainItem = { text: string; textNorm?: string; plainText?: string; surahNumber: number; ayahNumber: number };

type WorkerRequest =
  | { id: number; kind: "normalize-batch"; texts: string[] }
  | { id: number; kind: "plain-search"; query: string; items: PlainItem[]; limit?: number }
  | { id: number; kind: "hijri-label"; day: number; month: number; year: number };

type WorkerResponse =
  | { id: number; ok: true; kind: string; result: unknown }
  | { id: number; ok: false; error: string };

function plainSearch(query: string, items: readonly PlainItem[], limit: number): PlainItem[] {
  const raw = query.trim();
  if (!raw) return [];
  const needleNorm = normalizeArabic(raw);
  const needlePlain = stripArabicDiacritics(raw);
  const hits: PlainItem[] = [];
  for (const item of items) {
    if (raw && item.text.includes(raw)) {
      hits.push(item);
      continue;
    }
    const norm = item.textNorm ?? normalizeArabic(item.text);
    if (needleNorm && norm.includes(needleNorm)) {
      hits.push(item);
      continue;
    }
    const plain = item.plainText ?? stripArabicDiacritics(item.text);
    if (needlePlain && plain.includes(needlePlain)) {
      hits.push(item);
    }
  }
  return limit > 0 ? hits.slice(0, limit) : hits;
}

const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.kind === "normalize-batch") {
      const result = msg.texts.map((t) => normalizeArabic(t));
      postMessage({ id: msg.id, ok: true, kind: msg.kind, result } satisfies WorkerResponse);
      return;
    }
    if (msg.kind === "plain-search") {
      const limit = msg.limit ?? 120;
      const result = plainSearch(msg.query, msg.items, limit);
      postMessage({ id: msg.id, ok: true, kind: msg.kind, result } satisfies WorkerResponse);
      return;
    }
    if (msg.kind === "hijri-label") {
      const month = HIJRI_MONTHS[Math.max(0, Math.min(11, msg.month - 1))] ?? "";
      const result = `${msg.day} ${month} ${msg.year}هـ`;
      postMessage({ id: msg.id, ok: true, kind: msg.kind, result } satisfies WorkerResponse);
      return;
    }
    postMessage({ id: event.data.id, ok: false, error: "unknown-kind" } satisfies WorkerResponse);
  } catch (err) {
    postMessage({
      id: (event.data as WorkerRequest).id,
      ok: false,
      error: err instanceof Error ? err.message : "worker-failed",
    } satisfies WorkerResponse);
  }
});
