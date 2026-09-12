/** أعلام منصة المعرفة — P0 فقط مفعّل. */
export const KNOWLEDGE_PLATFORM_STAGE = {
  p0: true,
  p1: false,
  p2: false,
} as const;

const KILL = "majalis-kp-disabled";

export function isKnowledgePlatformP0Enabled(): boolean {
  if (!KNOWLEDGE_PLATFORM_STAGE.p0) return false;
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(KILL) !== "1";
  } catch {
    return true;
  }
}
