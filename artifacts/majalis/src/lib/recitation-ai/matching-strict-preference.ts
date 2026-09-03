const MATCHING_STRICT_KEY = "recitation-ai-matching-strict-v1";

export function readMatchingStrictPreference(): boolean {
  try {
    return localStorage.getItem(MATCHING_STRICT_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeMatchingStrictPreference(strict: boolean): void {
  try {
    localStorage.setItem(MATCHING_STRICT_KEY, strict ? "1" : "0");
  } catch {
    /* تجاهل */
  }
}
