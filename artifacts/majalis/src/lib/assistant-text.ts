export function cleanAssistantText(text: string) {
  return String(text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitAssistantLines(text: string) {
  return cleanAssistantText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
