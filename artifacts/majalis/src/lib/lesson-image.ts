/** SVG posters and generic placeholders — not real lesson photos. */
const PLACEHOLDER_PATTERNS = [
  /\/images\/posters\/.+\.svg$/i,
  /rashed-fundamental-course/i,
  /placeholder/i,
  /\/images\/posters\//i,
];

export function isPlaceholderLessonImage(url?: string | null): boolean {
  if (!url?.trim()) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(url.trim()));
}

export function resolveLessonPosterUrl(url?: string | null): string | undefined {
  if (isPlaceholderLessonImage(url)) return undefined;
  return url?.trim() || undefined;
}
