/**
 * حزمة خطوط QPC V2 — تنزيل تفاضلي إلى Cache API + نافذة ذاكرة ٥ صفحات.
 * WOFF2 حصراً. المصدر الافتراضي محلي `/fonts/qpc-v2/`؛ عند الغياب يُنزَّل من الشبكة.
 */

export const QPC_FONT_CACHE = "majalis-qpc-fonts-v1";
export const QPC_FONT_PACK_META_KEY = "majalis-qpc-font-pack-v1";
export const QPC_PAGE_COUNT = 604;
/** أقصى خطوط صفحة مقيمة في document.fonts أثناء التصفح */
export const QPC_FONT_MEMORY_WINDOW = 5;
/** جوار التحميل المسبق حول الصفحة الحالية */
export const QPC_FONT_PREFETCH_RADIUS = 2;

export type QpcFontPackMeta = {
  /** عدد الصفحات المكتملة في الكاش */
  completed: number;
  updatedAt: string;
};

export function qpcFontPath(page: number): string {
  return `fonts/qpc-v2/p${page}.woff2`;
}

/** يحترم Vite/Capacitor BASE_URL. */
export function qpcFontLocalUrl(page: number): string {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${qpcFontPath(page)}`;
}

/** مصدر احتياطي عند غياب الملف من الحزمة (بعد strip الأصلي). */
export function qpcFontRemoteUrl(page: number): string {
  return `https://quran.com/fonts/quran/hafs/v2/woff2/p${page}.woff2`;
}

export function pagesInWindow(
  center: number,
  radius: number = QPC_FONT_PREFETCH_RADIUS,
  maxPage: number = QPC_PAGE_COUNT,
): number[] {
  const out: number[] = [];
  for (let p = center - radius; p <= center + radius; p++) {
    if (p >= 1 && p <= maxPage) out.push(p);
  }
  return out;
}

export function readFontPackMeta(): QpcFontPackMeta {
  try {
    const raw = localStorage.getItem(QPC_FONT_PACK_META_KEY);
    if (!raw) return { completed: 0, updatedAt: "" };
    const parsed = JSON.parse(raw) as Partial<QpcFontPackMeta>;
    return {
      completed: Number(parsed.completed) || 0,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return { completed: 0, updatedAt: "" };
  }
}

export function writeFontPackMeta(meta: QpcFontPackMeta): void {
  try {
    localStorage.setItem(QPC_FONT_PACK_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

async function openFontCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(QPC_FONT_CACHE);
  } catch {
    return null;
  }
}

export async function isQpcFontCached(page: number): Promise<boolean> {
  const cache = await openFontCache();
  if (!cache) return false;
  try {
    const hit = await cache.match(qpcFontLocalUrl(page));
    return Boolean(hit);
  } catch {
    return false;
  }
}

/** Blob URLs من الكاش — تُلغى عند خروج الصفحة من نافذة الذاكرة. */
const pageBlobUrls = new Map<number, string>();

export function revokeQpcFontBlob(page: number): void {
  const url = pageBlobUrls.get(page);
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
  pageBlobUrls.delete(page);
}

let localPackProbe: Promise<boolean> | null = null;

/** هل ملفات `/fonts/qpc-v2/` موجودة في الحزمة؟ (false بعد native strip) */
export async function probeLocalQpcFonts(): Promise<boolean> {
  if (!localPackProbe) {
    localPackProbe = fetch(qpcFontLocalUrl(1), { method: "HEAD", cache: "no-store" })
      .then((r) => r.ok)
      .catch(() => false);
  }
  return localPackProbe;
}

/** للاختبارات فقط */
export function resetQpcFontPackProbesForTests(): void {
  localPackProbe = null;
  for (const page of [...pageBlobUrls.keys()]) revokeQpcFontBlob(page);
}

/** يُفضّل الكاش → المحلي → البعيد. يُرجع مصدر FontFace. */
export async function resolveQpcFontFaceSource(page: number): Promise<string> {
  const local = qpcFontLocalUrl(page);
  const cache = await openFontCache();
  if (cache) {
    try {
      const hit = await cache.match(local);
      if (hit) {
        const buf = await hit.arrayBuffer();
        const blob = new Blob([buf], { type: "font/woff2" });
        revokeQpcFontBlob(page);
        const blobUrl = URL.createObjectURL(blob);
        pageBlobUrls.set(page, blobUrl);
        return `url(${blobUrl}) format("woff2")`;
      }
    } catch {
      /* fall through */
    }
  }
  if (await probeLocalQpcFonts()) {
    return `url(${local}) format("woff2")`;
  }
  /* حزمة أصلية بلا خطوط: تنزيل مباشر من المصدر البعيد حتى يكتمل الكاش */
  return `url(${qpcFontRemoteUrl(page)}) format("woff2")`;
}

export type FontPackProgress = {
  done: number;
  total: number;
  page: number;
  /** نسبة ٠…١ */
  ratio: number;
};

/**
 * ينزّل صفحات الخط الناقصة إلى Cache API.
 * يسمح بالقراءة أثناء التنزيل عبر استدعاءات متوازية لـ ensurePageFontLoaded.
 */
export async function downloadQpcFontPack(options?: {
  pages?: number[];
  concurrency?: number;
  onProgress?: (p: FontPackProgress) => void;
  signal?: AbortSignal;
  /** إن فشل المحلي جرّب البعيد */
  allowRemoteFallback?: boolean;
}): Promise<{ downloaded: number; failed: number }> {
  const pages = options?.pages ?? Array.from({ length: QPC_PAGE_COUNT }, (_, i) => i + 1);
  const concurrency = Math.max(1, Math.min(6, options?.concurrency ?? 3));
  const allowRemote = options?.allowRemoteFallback !== false;
  const cache = await openFontCache();
  if (!cache) return { downloaded: 0, failed: pages.length };

  let downloaded = 0;
  let failed = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < pages.length) {
      if (options?.signal?.aborted) return;
      const idx = cursor++;
      const page = pages[idx]!;
      const local = qpcFontLocalUrl(page);
      try {
        const existing = await cache.match(local);
        if (existing) {
          downloaded += 1;
        } else {
          let res = await fetch(local, { signal: options?.signal, mode: "cors" });
          if (!res.ok && allowRemote) {
            res = await fetch(qpcFontRemoteUrl(page), { signal: options?.signal, mode: "cors" });
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          await cache.put(local, new Response(buf, {
            headers: { "Content-Type": "font/woff2", "Cache-Control": "public, max-age=31536000" },
          }));
          downloaded += 1;
        }
      } catch {
        failed += 1;
      }
      options?.onProgress?.({
        done: downloaded + failed,
        total: pages.length,
        page,
        ratio: (downloaded + failed) / pages.length,
      });
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  writeFontPackMeta({ completed: downloaded, updatedAt: new Date().toISOString() });
  return { downloaded, failed };
}

/** تقدير حجم مضغوط لنافذة N صفحات (متوسط ١٥٨ ك.ب). */
export function estimateWindowBytes(pageCount: number = QPC_FONT_MEMORY_WINDOW): number {
  return Math.round(pageCount * 158 * 1024);
}
