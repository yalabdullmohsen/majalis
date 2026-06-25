import { stripMarkdown } from "./strip-markdown";

/** Clean user-visible text from markdown artifacts. */
export function displayText(text: string | null | undefined): string {
  if (!text) return "";
  return stripMarkdown(text);
}

/** Strip markdown and replace decorative dashes with natural spacing. */
export function cleanDisplayText(text: string | null | undefined): string {
  if (!text) return "";
  return displayText(text)
    .replace(/\s*[—–\-_]{1,}\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
