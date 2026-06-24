import { stripMarkdown } from "./strip-markdown";

export function cleanAssistantText(text: string) {
  return stripMarkdown(
    String(text || "")
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?/g, "").replace(/```/g, ""))
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^\s*\d+\.\s+/gm, "• ")
      .replace(/\n{3,}/g, "\n\n")
  );
}

export function splitAssistantLines(text: string) {
  return cleanAssistantText(text)
    .split("\n")
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}
