export type ReadingSurface = "light" | "dark" | "sepia";

export const READING_SURFACE_KEY = "majalis-reading-surface-v1";

export const READING_SURFACE_OPTIONS: {
  id: ReadingSurface;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "أبيض", description: "خلفية بيضاء للقراءة النهارية" },
  { id: "sepia", label: "بني مريح", description: "لون بني دافئ يُريح العين" },
  { id: "dark", label: "ليلي", description: "وضع داكن للقراءة الليلية" },
];

export function readReadingSurface(): ReadingSurface {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(READING_SURFACE_KEY);
  if (stored === "light" || stored === "dark" || stored === "sepia") return stored;
  return "light";
}

export function writeReadingSurface(surface: ReadingSurface) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READING_SURFACE_KEY, surface);
  applyReadingSurface(surface);
}

export function applyReadingSurface(surface: ReadingSurface = readReadingSurface()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.readingSurface = surface;
}
