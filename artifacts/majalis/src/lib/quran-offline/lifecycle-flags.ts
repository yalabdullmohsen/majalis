/**
 * Sync flags for resource lifecycle — tiny module to avoid circular imports
 * between warm/prefetch and the lifecycle orchestrator.
 */
let prefetchSuspended = false;
let indexingSuspended = false;

export function setQuranPrefetchSuspended(v: boolean): void {
  prefetchSuspended = v;
}

export function setQuranIndexingSuspended(v: boolean): void {
  indexingSuspended = v;
}

export function isQuranPrefetchSuspended(): boolean {
  return prefetchSuspended;
}

export function isQuranIndexingSuspended(): boolean {
  return indexingSuspended;
}

export function __resetLifecycleFlagsForTests(): void {
  prefetchSuspended = false;
  indexingSuspended = false;
}
