import { sheikhNameKey } from "@/lib/sheikh-name";

/** Local sheikh portrait paths — official portraits in public/sheikhs. */
const SHEIKH_PHOTOS: Record<string, string> = {
  "عثمان بن محمد الخميس": "/sheikhs/othman-alkhamees.jpg",
  "راشد صليهم فهد الصليهم": "/sheikhs/rashed-alsulayyim.svg",
  "منصور بن ناصر الخالدي": "/sheikhs/mansour-alkhalidi.svg",
  "أسامة الشطي": "/sheikhs/osama-alshatti.svg",
  "سالم بن سعد الطويل": "/sheikhs/salem-altaweel.svg",
  "سالم الطويل": "/sheikhs/salem-altaweel.svg",
  "حسين بن مبارك المويزري": "/sheikhs/hussein-muwaiziri.svg",
  "دهام أبو خشبة": "/sheikhs/daham-abukhashba.svg",
  "نصار خالد نصار العجمي": "/sheikhs/nasar-alajmi.svg",
  "حامد علي المسعد": "/sheikhs/hamed-almesaad.svg",
  "فيصل زويد": "/sheikhs/faisal-zowaid.svg",
  "سعد هزاع العتيبي": "/sheikhs/saad-otaibi.svg",
  "بندر محمد الميموني": "/sheikhs/bandar-almaimouni.svg",
  "مطلق جاسر مطلق الجاسر": "/sheikhs/mutlaq-aljasser.svg",
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
