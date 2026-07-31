/**
 * Vite client stub — replaces json-seed-disk.node during browser builds.
 * Node/tsx tests import the real .node module directly (no Vite alias).
 */
export async function readSeedJsonFromDisk(_urlPath: string): Promise<unknown | null> {
  return null;
}
