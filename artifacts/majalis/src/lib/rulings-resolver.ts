/**
 * Resolver موحّد لمسارات /rulings/:identifier
 */

import type { ShariaRulingExtended } from "./rulings-types";
import {
  classifyRulingIdentifier,
  inferRulingContentType,
  isAllowedOnRulingsRoute,
  type RulingContentType,
  type RulingIdentifierKind,
} from "./rulings-content-type";
import { isPubliclyVisibleRuling } from "./rulings-publication-gate";

export type RulingResolveStatus =
  | "found"
  | "notFound"
  | "removed"
  | "invalidType"
  | "wrongContentType"
  | "unpublished";

export type RulingResolveResult = {
  status: RulingResolveStatus;
  kind: RulingIdentifierKind;
  identifier: string;
  contentType?: RulingContentType;
  data?: ShariaRulingExtended;
  reason?: string;
};

function isRemovedStatus(row: ShariaRulingExtended): boolean {
  const v = String(row.verification_status || "").toLowerCase();
  const s = String(row.status || "").toLowerCase();
  return v === "archived" || s === "archived" || s === "removed" || s === "deleted";
}

/** يقيّم سجلًا خامًا بعد الجلب من DB أو البذرة */
export function evaluateRulingRecord(
  identifier: string,
  row: ShariaRulingExtended | null | undefined,
  opts?: { allowUnpublished?: boolean },
): RulingResolveResult {
  const kind = classifyRulingIdentifier(identifier);
  if (kind === "invalid") {
    return { status: "invalidType", kind, identifier, reason: "invalid_identifier" };
  }
  if (!row) {
    return { status: "notFound", kind, identifier };
  }
  const contentType = inferRulingContentType({
    ...row,
    content_type: (row as ShariaRulingExtended & { content_type?: string }).content_type,
  });
  if (!isAllowedOnRulingsRoute({ ...row, content_type: contentType })) {
    return {
      status: "wrongContentType",
      kind,
      identifier,
      contentType,
      reason: `content_type=${contentType}`,
    };
  }
  if (isRemovedStatus(row)) {
    return { status: "removed", kind, identifier, contentType, data: row };
  }
  if (!opts?.allowUnpublished && !isPubliclyVisibleRuling(row)) {
    return {
      status: "unpublished",
      kind,
      identifier,
      contentType,
      reason: `verification_status=${row.verification_status || "missing"}`,
    };
  }
  return { status: "found", kind, identifier, contentType, data: row };
}

export function httpStatusForRulingResolve(status: RulingResolveStatus): number {
  switch (status) {
    case "found":
      return 200;
    case "removed":
      return 410;
    case "unpublished":
      return 404;
    case "invalidType":
    case "wrongContentType":
    case "notFound":
    default:
      return 404;
  }
}
