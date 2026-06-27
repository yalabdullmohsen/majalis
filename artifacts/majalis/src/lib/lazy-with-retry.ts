import { lazy, type ComponentType, type LazyExoticComponent } from "react";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importWithRetry<T>(
  factory: () => Promise<T>,
  retriesLeft = 2,
  delayMs = 600,
): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    if (retriesLeft <= 0) throw error;
    await wait(delayMs);
    return importWithRetry(factory, retriesLeft - 1, Math.round(delayMs * 1.5));
  }
}

/** Lazy import with automatic retry — reduces chunk-load failures after deploys. */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => importWithRetry(factory));
}
