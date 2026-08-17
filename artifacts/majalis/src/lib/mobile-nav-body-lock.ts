const BODY_LOCK_CLASS = "mobile-nav-body-lock";

let lockedScrollY = 0;

/** Strip any stale nav lock classes left by bfcache, SW cache, or failed cleanup. */
export function resetMobileNavBodyLock() {
  if (typeof document === "undefined") return;
  document.body.classList.remove("side-nav-open", "navbar-more-open", BODY_LOCK_CLASS);
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("touch-action");
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("width");
}

/** Remove orphaned portaled overlays — لا تمس #drawer-root المركّب دائماً. */
export function purgeStaleMobileNavLayers() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".mobile-nav-layer").forEach((node) => {
    if (node.id === "drawer-root" || node.closest("#drawer-root")) return;
    node.remove();
  });
}

export function applyMobileNavBodyLock() {
  if (typeof document === "undefined") return;
  if (!document.body.classList.contains(BODY_LOCK_CLASS)) {
    lockedScrollY = window.scrollY;
  }
  document.body.classList.add(BODY_LOCK_CLASS);
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.width = "100%";
  document.body.style.touchAction = "none";
}

export function releaseMobileNavBodyLock() {
  if (typeof document === "undefined") return;
  const wasLocked = document.body.classList.contains(BODY_LOCK_CLASS);
  resetMobileNavBodyLock();
  if (wasLocked) {
    window.scrollTo(0, lockedScrollY);
  }
  purgeStaleMobileNavLayers();
}
