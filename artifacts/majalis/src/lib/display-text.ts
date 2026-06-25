import { stripMarkdown } from "./strip-markdown";

/** Clean user-visible text from markdown artifacts. */
export function displayText(text: string | null | undefined): string {
  if (!text) return "";
  return stripMarkdown(text);
}
