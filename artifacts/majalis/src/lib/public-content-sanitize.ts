/**
 * Sanitize public-facing content before render — removes internal markers.
 */
import { displayText } from "./display-text";

const STRIP_PATTERNS: RegExp[] = [
  /\[import[\-_]?\d+\]/gi,
  /\[e2e[\-_]?[^\]]+\]/gi,
  /\be2e[\-_]?test[\-_]?\d*\b/gi,
  /\b\d{13}[\-_]\d+\b/g,
  /\s*\(Phase\s*2\)\s*/gi,
  /\s*—?\s*Phase\s*2\s*/gi,
  /\bPhase2[\-_]?\w*\b/gi,
  /\[(verify|staging|debug)[^\]]*\]/gi,
];

export function sanitizePublicText(text: string | null | undefined): string {
  let value = displayText(text);
  for (const pattern of STRIP_PATTERNS) {
    value = value.replace(pattern, " ");
  }
  return value.replace(/\s{2,}/g, " ").trim();
}

export function mapPublicFawaid(item: Record<string, unknown>) {
  return {
    id: String(item.id ?? ""),
    text: sanitizePublicText(String(item.text ?? "")),
    category: item.category ? String(item.category) : undefined,
    source: item.source ? sanitizePublicText(String(item.source)) : undefined,
    author_name: item.author_name ? sanitizePublicText(String(item.author_name)) : undefined,
    created_at: item.created_at,
  };
}

export function mapPublicLesson(item: Record<string, unknown>) {
  return {
    ...item,
    title: sanitizePublicText(String(item.title ?? "")),
    description: item.description ? sanitizePublicText(String(item.description)) : undefined,
    mosque: item.mosque ? sanitizePublicText(String(item.mosque)) : undefined,
    speaker_name: item.speaker_name ? sanitizePublicText(String(item.speaker_name)) : undefined,
  };
}
