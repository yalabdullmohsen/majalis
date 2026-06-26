import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAJALIS_ROOT = path.resolve(__dirname, '../..');
const SOURCES_PATH = path.join(MAJALIS_ROOT, 'data/kuwait-lesson-sources.json');

let cachedRegistry = null;

function estimateDailyItems(source) {
  if (source.estimated_daily_items) return source.estimated_daily_items;
  if (!source.is_active) return 0;
  if (source.connector_type === 'manifest') return 8;
  if (source.connector_type === 'rss') return 3;
  if (source.connector_type === 'official_site') return 2;
  return 0;
}

export function adaptSource(source) {
  return {
    id: source.slug,
    slug: source.slug,
    name: source.name,
    type: source.connector_type,
    active: Boolean(source.is_active),
    status: !source.is_active
      ? source.connector_type === 'pending_official'
        ? 'pending_official'
        : 'inactive'
      : 'active',
    official_url: source.official_url ?? null,
    manifest_path: source.manifest_file ? path.join(MAJALIS_ROOT, 'data', source.manifest_file) : null,
    rss_url: source.rss_url ?? null,
    auto_publish: source.auto_publish !== false,
    manifest_filter: source.manifest_filter ?? null,
    estimated_daily_items: estimateDailyItems(source),
    notes: source.notes ?? null,
    trust_level: source.trust_level ?? 0,
    legal_basis: source.legal_basis ?? null,
  };
}

export function loadSourcesRegistry() {
  if (cachedRegistry) return cachedRegistry;
  const raw = fs.readFileSync(SOURCES_PATH, 'utf8');
  cachedRegistry = JSON.parse(raw);
  return cachedRegistry;
}

export function reloadSourcesRegistry() {
  cachedRegistry = null;
  return loadSourcesRegistry();
}

export function listActiveSources() {
  const registry = loadSourcesRegistry();
  return (registry.sources ?? []).filter((source) => source.is_active).map(adaptSource);
}

export function listAllSources() {
  const registry = loadSourcesRegistry();
  return (registry.sources ?? []).map(adaptSource);
}

export function getSourceById(sourceId) {
  const registry = loadSourcesRegistry();
  const found = (registry.sources ?? []).find((source) => source.slug === sourceId);
  return found ? adaptSource(found) : null;
}

export function listPendingSources() {
  const registry = loadSourcesRegistry();
  return (registry.sources ?? [])
    .filter((source) => !source.is_active || source.connector_type === 'pending_official')
    .map(adaptSource);
}

export function getRegistryPolicy() {
  const registry = loadSourcesRegistry();
  return registry.policy ?? {};
}

export function summarizeRegistry() {
  const registry = loadSourcesRegistry();
  const sources = (registry.sources ?? []).map(adaptSource);
  const activeSources = sources.filter((s) => s.active);
  const pendingSources = sources.filter((s) => s.status === 'pending_official' || !s.active);

  return {
    version: registry.version,
    updated_at: registry.updated_at,
    policy: registry.policy,
    total: sources.length,
    active: activeSources.length,
    pending: pendingSources.length,
    inactive: sources.filter((s) => !s.active).length,
    estimated_daily_capacity: activeSources.reduce((sum, s) => sum + (s.estimated_daily_items ?? 0), 0),
    by_type: sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] ?? 0) + 1;
      return acc;
    }, {}),
    connected: activeSources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      auto_publish: source.auto_publish,
      official_url: source.official_url,
      estimated_daily_items: source.estimated_daily_items,
    })),
    pending_integration: pendingSources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      notes: source.notes,
      official_url: source.official_url,
    })),
  };
}
