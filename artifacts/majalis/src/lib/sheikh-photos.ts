import { sheikhNameKey } from "@/lib/sheikh-name";

/** Local sheikh portrait paths — official portraits in public/sheikhs. */
const SHEIKH_PHOTOS: Record<string, string> = {
  "عثمان بن محمد الخميس": "/sheikhs/othman-alkhamees.svg",
  "راشد صليهم فهد الصليهم": "/sheikhs/rashed-alsulayyim.svg",
  "منصور بن ناصر الخالدي": "/sheikhs/mansour-alkhalidi.svg",
  "أسامة الشطي": "/sheikhs/osama-alshatti.svg",
};

/** Resolve a local sheikh photo from name; falls back to logo.png. */
export function resolveLocalSheikhPhoto(name?: string | null): string {
  const key = sheikhNameKey(name || "");
  if (!key) return "/logo.png";

  for (const [pattern, path] of Object.entries(SHEIKH_PHOTOS)) {
    const patternKey = sheikhNameKey(pattern);
    if (patternKey === key || key.includes(patternKey) || patternKey.includes(key)) {
      return path;
    }
  }

  return "/logo.png";
}

export const SHEIKH_PHOTO_PATHS = Object.values(SHEIKH_PHOTOS);
