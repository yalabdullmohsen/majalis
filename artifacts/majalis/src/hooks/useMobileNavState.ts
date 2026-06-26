import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { applyMobileNavBodyLock, releaseMobileNavBodyLock, resetMobileNavBodyLock } from "@/lib/mobile-nav-body-lock";

export function useMobileNavState() {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const prevLocation = useRef(location);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const closeAll = useCallback(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
    releaseMobileNavBodyLock();
  }, []);

  const openDrawer = useCallback(() => {
    setMoreOpen(false);
    setDrawerOpen(true);
  }, []);

  const toggleMore = useCallback(() => {
    setDrawerOpen(false);
    setMoreOpen((open) => !open);
  }, []);

  useEffect(() => {
    resetMobileNavBodyLock();
  }, []);

  useEffect(() => {
    if (prevLocation.current === location) return;
    prevLocation.current = location;
    closeAll();
  }, [location, closeAll]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) closeAll();
    };
    const onOrientationChange = () => closeAll();
    const onPopState = () => closeAll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAll]);

  useEffect(() => {
    if (!drawerOpen && !moreOpen) {
      releaseMobileNavBodyLock();
      return;
    }
    applyMobileNavBodyLock();
    return () => releaseMobileNavBodyLock();
  }, [drawerOpen, moreOpen]);

  return {
    drawerOpen,
    moreOpen,
    openDrawer,
    closeDrawer,
    closeMore,
    toggleMore,
    closeAll,
    setMoreOpen,
  };
}
