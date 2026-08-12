import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  applyMobileNavBodyLock,
  purgeStaleMobileNavLayers,
  releaseMobileNavBodyLock,
  resetMobileNavBodyLock,
} from "@/lib/mobile-nav-body-lock";

export function useMobileNavState() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const prevLocation = useRef(location);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const closeAll = useCallback(() => {
    setIsMenuOpen(false);
    setMoreOpen(false);
    releaseMobileNavBodyLock();
  }, []);

  const toggleMenu = useCallback(() => {
    setMoreOpen(false);
    setIsMenuOpen((open) => !open);
  }, []);

  const openMenu = useCallback(() => {
    setMoreOpen(false);
    setIsMenuOpen(true);
  }, []);

  const toggleMore = useCallback(() => {
    setIsMenuOpen(false);
    setMoreOpen((open) => !open);
  }, []);

  useEffect(() => {
    resetMobileNavBodyLock();
    purgeStaleMobileNavLayers();
  }, []);

  useEffect(() => {
    if (!isMenuOpen && !moreOpen) {
      purgeStaleMobileNavLayers();
    }
  }, [isMenuOpen, moreOpen]);

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
    if (!isMenuOpen && !moreOpen) {
      releaseMobileNavBodyLock();
      return;
    }
    applyMobileNavBodyLock();
    return () => releaseMobileNavBodyLock();
  }, [isMenuOpen, moreOpen]);

  return {
    isMenuOpen,
    setIsMenuOpen,
    drawerOpen: isMenuOpen,
    moreOpen,
    toggleMenu,
    openMenu,
    closeMenu,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
    closeMore,
    toggleMore,
    closeAll,
    setMoreOpen,
  };
}
