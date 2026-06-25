import type { CmsContentKind, CmsContentRecord } from "../content-types";
import { normalizeImportRow, stripHtml, validateUrl } from "../normalize";
import { detectDuplicates, ensureExternalKey, type DedupCandidate } from "../dedup-service";
import { cmsUpsert, fetchDedupCandidates, runImportJob, type CmsUpsertOptions } from "../cms-service";

/** Source adapter interface — add new sources without changing core engine. */
export type ContentSourceAdapter = {
  slug: string;
  name: string;
  kind: CmsContentKind;
  /** Fetch raw rows from source */
  fetch: () => Promise<Record<string, unknown>[]>;
};

/** JSON paste / file source (used by BulkImport). */
export function createJsonSource(
  kind: CmsContentKind,
  rows: Record<string, unknown>[],
): ContentSourceAdapter {
  return {
    slug: "json-bulk",
    name: "استيراد JSON",
    kind,
    fetch: async () => rows,
  };
}

/** Pipeline: clean → normalize → dedup check → upsert */
export async function runAggregatorPipeline(
  source: ContentSourceAdapter,
  options: CmsUpsertOptions & { dryRun?: boolean } = {},
) {
  const rawRows = await source.fetch();
  const cleaned: CmsContentRecord[] = [];
  const linkErrors: string[] = [];

  for (const row of rawRows) {
    const scrubbed = { ...row };
    for (const key of Object.keys(scrubbed)) {
      if (typeof scrubbed[key] === "string") scrubbed[key] = stripHtml(String(scrubbed[key]));
    }
    const record = normalizeImportRow(source.kind, scrubbed);
    record.external_key = ensureExternalKey(record);

    if (options.validateLinks && record.source_urls) {
      for (const url of record.source_urls) {
        const v = await validateUrl(url, false);
        if (!v.ok) linkErrors.push(`${record.title}: ${url}`);
      }
    }
    cleaned.push(record);
  }

  if (options.dryRun) {
    const candidates = await fetchDedupCandidates(source.kind);
    const preview = cleaned.map((record) => ({
      record,
      dedup: detectDuplicates(record, candidates),
    }));
    return { dryRun: true as const, preview, linkErrors, total: cleaned.length };
  }

  const summary = await runImportJob(source.kind, rawRows, source.slug, options);
  return { dryRun: false as const, summary, linkErrors };
}

/** Register a custom source and run immediately. */
export async function ingestFromSource(
  adapter: ContentSourceAdapter,
  options?: CmsUpsertOptions,
) {
  return runAggregatorPipeline(adapter, options);
}

/** Single-row ingest with dedup preview. */
export async function previewDedup(
  kind: CmsContentKind,
  row: Record<string, unknown>,
  extraCandidates: DedupCandidate[] = [],
) {
  const record = normalizeImportRow(kind, row);
  record.external_key = ensureExternalKey(record);
  const candidates = [...(await fetchDedupCandidates(kind)), ...extraCandidates];
  return detectDuplicates(record, candidates);
}

/** Re-export runImportJob for direct use. */
export { runImportJob, cmsUpsert };
