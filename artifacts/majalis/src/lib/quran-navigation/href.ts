import type { QuranAyahReference } from "./types";

/** عقد Deep Link الموحّد — قارئ واحد، بلا route لكل صفحة. */
export function buildMushafAyahHref(
  ref: Pick<QuranAyahReference, "surahId" | "ayahId" | "pageNumber" | "navigationSource">,
  opts?: { returnTo?: string; highlight?: boolean },
): string {
  const qs = new URLSearchParams();
  qs.set("page", String(ref.pageNumber));
  qs.set("surah", String(ref.surahId));
  qs.set("ayah", String(ref.ayahId));
  if (opts?.highlight !== false) qs.set("highlight", "1");
  qs.set("source", ref.navigationSource);
  if (opts?.returnTo) qs.set("returnTo", opts.returnTo);
  return `/mushaf?${qs.toString()}`;
}

export type ParsedMushafNavQuery = {
  page?: number;
  surahId?: number;
  ayahId?: number;
  highlight: boolean;
  source?: string;
  returnTo?: string;
};

export function parseMushafNavQuery(search: string): ParsedMushafNavQuery {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const qs = new URLSearchParams(raw);
  const page = Number.parseInt(qs.get("page") ?? "", 10);
  const surahId = Number.parseInt(qs.get("surah") ?? "", 10);
  const ayahRaw = qs.get("ayah") ?? "";
  /* دعم ayah=2:34 */
  if (ayahRaw.includes(":")) {
    const [s, a] = ayahRaw.split(":").map((x) => Number.parseInt(x, 10));
    if (Number.isFinite(s) && Number.isFinite(a)) {
      return {
        page: Number.isFinite(page) ? page : undefined,
        surahId: s,
        ayahId: a,
        highlight: qs.get("highlight") !== "0",
        source: qs.get("source") ?? undefined,
        returnTo: qs.get("returnTo") ?? undefined,
      };
    }
  }
  const ayahId = Number.parseInt(ayahRaw, 10);
  return {
    page: Number.isFinite(page) ? page : undefined,
    surahId: Number.isFinite(surahId) ? surahId : undefined,
    ayahId: Number.isFinite(ayahId) ? ayahId : undefined,
    highlight: qs.get("highlight") === "1" || (qs.has("ayah") && qs.get("highlight") !== "0"),
    source: qs.get("source") ?? undefined,
    returnTo: qs.get("returnTo") ?? undefined,
  };
}

export function verseKeyFromRef(ref: Pick<QuranAyahReference, "surahId" | "ayahId">): string {
  return `${ref.surahId}:${ref.ayahId}`;
}
