/**
 * خريطة روابط عميقة ↔ كيانات — منع open redirect وstaging.
 */

import { resolveContentRef } from "@/lib/knowledge-platform/content-resolver";
import type { ContentEntityKind } from "@/lib/knowledge-platform/content-entity";
import { resolveNativeDeepLinkPath } from "@/lib/native-deep-link";

const BLOCKED_HOST_SNIPPETS = ["staging.", "localhost", "127.0.0.1", "vercel.app", "netlify.app"];

export type DeepLinkMapResult = {
  ok: boolean;
  path: string | null;
  reason?: string;
  kind?: ContentEntityKind;
  id?: string;
};

export function isBlockedShareHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_HOST_SNIPPETS.some((s) => host.includes(s));
  } catch {
    return true;
  }
}

export function mapShareOrDeepLink(input: string): DeepLinkMapResult {
  const trimmed = String(input || "").trim();
  if (!trimmed) return { ok: false, path: null, reason: "empty" };
  if (trimmed.includes("..")) return { ok: false, path: null, reason: "traversal" };

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("majlisilm:")) {
    if (/^https?:\/\//i.test(trimmed) && isBlockedShareHost(trimmed)) {
      return { ok: false, path: null, reason: "blocked_host" };
    }
    const path = resolveNativeDeepLinkPath(trimmed);
    if (!path) return { ok: false, path: null, reason: "untrusted_or_invalid" };
    return { ok: true, path };
  }

  const m = trimmed.match(/^content:\/\/([a-z_]+)\/([^?#]+)/i);
  if (m) {
    const kind = m[1] as ContentEntityKind;
    const id = decodeURIComponent(m[2]);
    const card = resolveContentRef({ kind, id });
    if (!card) return { ok: false, path: null, reason: "unknown_entity", kind, id };
    return { ok: true, path: card.href, kind, id };
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.includes("://")) return { ok: false, path: null, reason: "open_redirect" };
    return { ok: true, path: trimmed };
  }

  return { ok: false, path: null, reason: "unsupported" };
}

export function buildContentDeepLink(kind: ContentEntityKind, id: string): string | null {
  const card = resolveContentRef({ kind, id });
  if (!card) return null;
  return `content://${kind}/${encodeURIComponent(id)}`;
}
