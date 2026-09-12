import { buildMushafContinueSnapshot } from "./mushaf-snapshots";
import { buildNextPrayerSnapshot, buildPrayerTimesDaySnapshot } from "./prayer-snapshots";
import { resolveAccountScope } from "./privacy";
import {
  clearWidgetBundles,
  getStoredAccountScope,
  readWidgetBundle,
  writeWidgetBundleAtomic,
} from "./storage";
import {
  WIDGET_BRAND,
  WIDGET_SCHEMA_VERSION,
  type WidgetBundleFile,
  type WidgetSnapshotEnvelope,
  type WidgetType,
} from "./types";

export type PublishWidgetsResult = {
  ok: boolean;
  reason?: string;
  snapshotCount: number;
  accountScope: string;
};

export async function publishCoreWidgetSnapshots(opts?: {
  userId?: string | null;
  now?: Date;
}): Promise<PublishWidgetsResult> {
  const accountScope = resolveAccountScope(opts?.userId);
  const previous = getStoredAccountScope();
  if (previous && previous !== accountScope) clearWidgetBundles();

  const [nextPrayer, prayerDay, mushaf] = await Promise.all([
    buildNextPrayerSnapshot(opts),
    buildPrayerTimesDaySnapshot(opts),
    buildMushafContinueSnapshot(opts),
  ]);

  const snapshots: WidgetSnapshotEnvelope[] = [nextPrayer, prayerDay, mushaf];
  const bundle: WidgetBundleFile = {
    schemaVersion: WIDGET_SCHEMA_VERSION,
    brand: WIDGET_BRAND,
    writtenAt: (opts?.now ?? new Date()).toISOString(),
    accountScope,
    snapshots,
  };
  const write = writeWidgetBundleAtomic(bundle);
  return { ok: write.ok, reason: write.reason, snapshotCount: snapshots.length, accountScope };
}

export function readPublishedSnapshot(type: WidgetType): WidgetSnapshotEnvelope | null {
  return readWidgetBundle()?.snapshots.find((s) => s.widgetType === type) ?? null;
}

export function invalidateWidgetsForAccountChange(): void {
  clearWidgetBundles();
}

export function getWidgetBundle(): WidgetBundleFile | null {
  return readWidgetBundle();
}
