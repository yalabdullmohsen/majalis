const HONORIFIC_PREFIX =
  /^(?:فضيلة|معالي|سمو|صاحب|العلامة|الشيخ(?:\s+الدكتور|\s+د\.?)?|الدكتور|د\.|Dr\.?)\s+/iu;

const DEGREE_PREFIX = /^(?:د\.|Dr\.)\s*/iu;

/** Strip honorifics and return the core name only. */
export function stripSheikhHonorifics(name: string): string {
  let value = String(name || "").trim();
  if (!value) return "";

  for (let i = 0; i < 4; i += 1) {
    const next = value.replace(HONORIFIC_PREFIX, "").replace(DEGREE_PREFIX, "").trim();
    if (next === value) break;
    value = next;
  }

  return value.replace(/\s+/g, " ").trim();
}

/** Unified display: الشيخ: سالم الطويل */
export function formatSheikhName(name: string): string {
  const core = stripSheikhHonorifics(name);
  if (!core) return "";
  return `الشيخ: ${core}`;
}

/** Compare/filter key without the prefix. */
export function sheikhNameKey(name: string): string {
  return stripSheikhHonorifics(name).toLowerCase();
}

/** Safe strip of «الشيخ:» prefix — never throws on null/undefined. */
export function stripSheikhPrefix(name?: string | null): string {
  return stripSheikhHonorifics(String(name || "").replace(/^الشيخ:\s*/u, ""));
}
