/** Fine-tuned focal points per portrait file (object-position fallback + crop bias). */
export type SheikhFocalPoint = {
  /** Horizontal focal point 0–100 */
  x: number;
  /** Vertical focal point 0–100 */
  y: number;
  /** Optional scale boost for small source images (1 = default) */
  scale?: number;
};

const FOCAL_BY_FILE: Record<string, SheikhFocalPoint> = {
  "othman-alkhamees.jpg": { x: 50, y: 34, scale: 1.02 },
  "othman-alkhamees.svg": { x: 50, y: 40 },
  "salem-altaweel.jpg": { x: 50, y: 36, scale: 1.04 },
  "salem-altaweel.svg": { x: 50, y: 40 },
  "mansour-alkhalidi.jpg": { x: 50, y: 35, scale: 1.03 },
  "mansour-alkhalidi.svg": { x: 50, y: 40 },
  "rashed-alsulayyim.svg": { x: 50, y: 40 },
  "osama-alshatti.svg": { x: 50, y: 40 },
  "hussein-muwaiziri.svg": { x: 50, y: 40 },
  "daham-abukhashba.svg": { x: 50, y: 40 },
  "nasar-alajmi.svg": { x: 50, y: 40 },
  "hamed-almesaad.svg": { x: 50, y: 40 },
  "faisal-zowaid.svg": { x: 50, y: 40 },
  "saad-otaibi.svg": { x: 50, y: 40 },
  "bandar-almaimouni.svg": { x: 50, y: 40 },
  "mutlaq-aljasser.svg": { x: 50, y: 40 },
};

const DEFAULT_FOCAL: SheikhFocalPoint = { x: 50, y: 36 };

export function resolveSheikhFocalPoint(src?: string | null): SheikhFocalPoint {
  if (!src) return DEFAULT_FOCAL;
  const file = src.split("/").pop()?.split("?")[0] ?? "";
  return FOCAL_BY_FILE[file] ?? DEFAULT_FOCAL;
}

export function focalToObjectPosition(focal: SheikhFocalPoint): string {
  return `${focal.x}% ${focal.y}%`;
}
