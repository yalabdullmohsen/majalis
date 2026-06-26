const BODY_LOCK_CLASS = "mobile-nav-body-lock";

/** Strip any stale nav lock classes left by bfcache, SW cache, or failed cleanup. */
export function resetMobileNavBodyLock() {
  if (typeof document === "undefined") return;
  document.body.classList.remove("side-nav-open", "navbar-more-open", BODY_LOCK_CLASS);
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("touch-action");
}

export function applyMobileNavBodyLock() {
  if (typeof document === "undefined") return;
  document.body.classList.add(BODY_LOCK_CLASS);
}

export function releaseMobileNavBodyLock() {
  resetMobileNavBodyLock();
}
