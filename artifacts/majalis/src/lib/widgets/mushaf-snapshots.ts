import { loadLastPage, loadLastPageSync } from "@/lib/quran-last-page";
import { resolveContentRef } from "@/lib/knowledge-platform/content-resolver";
import { snapshotChecksum } from "./checksum";
import { deepLinkForMushafPage, deepLinkForWidgetType } from "./deep-links";
import { defaultPrivacyForType, resolveAccountScope } from "./privacy";
import {
  WIDGET_READER_VERSION,
  WIDGET_SCHEMA_VERSION,
  type MushafContinuePayload,
  type WidgetSnapshotEnvelope,
} from "./types";

export async function buildMushafContinueSnapshot(opts?: {
  userId?: string | null;
  now?: Date;
  page?: number | null;
}): Promise<WidgetSnapshotEnvelope<MushafContinuePayload>> {
  const now = opts?.now ?? new Date();
  const accountScope = resolveAccountScope(opts?.userId);
  const generatedAt = now.toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait";
  let page =
    opts?.page !== undefined ? opts.page : ((await loadLastPage()) ?? loadLastPageSync());
  if (page != null && (!Number.isFinite(page) || page < 1 || page > 604)) page = null;

  if (page == null) {
    const payload: MushafContinuePayload = { page: null, href: null };
    return {
      widgetId: "mushaf_continue",
      widgetType: "mushaf_continue",
      schemaVersion: WIDGET_SCHEMA_VERSION,
      readerVersion: WIDGET_READER_VERSION,
      generatedAt,
      validUntil: new Date(now.getTime() + 86_400_000).toISOString(),
      locale: "ar",
      timezone,
      theme: "system",
      privacyLevel: defaultPrivacyForType("mushaf_continue"),
      accountScope,
      dataSourceVersion: "quran-last-page/v1",
      deepLink: deepLinkForWidgetType("mushaf_continue"),
      fallbackState: "no_progress",
      payload,
      checksum: snapshotChecksum({
        widgetId: "mushaf_continue",
        widgetType: "mushaf_continue",
        accountScope,
        generatedAt,
        payload,
      }),
    };
  }

  const card = resolveContentRef({ kind: "quran_page", id: String(page) }, `صفحة ${page}`);
  const deepLink = deepLinkForMushafPage(page);
  const payload: MushafContinuePayload = {
    page,
    href: card?.href ?? deepLink.path,
    surahHint: null,
  };
  return {
    widgetId: "mushaf_continue",
    widgetType: "mushaf_continue",
    schemaVersion: WIDGET_SCHEMA_VERSION,
    readerVersion: WIDGET_READER_VERSION,
    generatedAt,
    validUntil: new Date(now.getTime() + 86_400_000).toISOString(),
    locale: "ar",
    timezone,
    theme: "system",
    privacyLevel: defaultPrivacyForType("mushaf_continue"),
    accountScope,
    dataSourceVersion: "quran-last-page/v1",
    deepLink,
    fallbackState: "ok",
    payload,
    checksum: snapshotChecksum({
      widgetId: "mushaf_continue",
      widgetType: "mushaf_continue",
      accountScope,
      generatedAt,
      payload,
    }),
  };
}
