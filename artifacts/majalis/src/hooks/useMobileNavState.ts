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
  const [accountOpen, setAccountOpen] = useState(false);
  const prevLocation = useRef(location);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  const closeAll = useCallback(() => {
    setIsMenuOpen(false);
    setAccountOpen(false);
    releaseMobileNavBodyLock();
  }, []);

  const toggleMenu = useCallback(() => {
    setAccountOpen(false);
    setIsMenuOpen((open) => !open);
  }, []);

  const openMenu = useCallback(() => {
    setAccountOpen(false);
    setIsMenuOpen(true);
  }, []);

  const toggleAccount = useCallback(() => {
    setIsMenuOpen(false);
    setAccountOpen((open) => !open);
  }, []);

  useEffect(() => {
    resetMobileNavBodyLock();
    purgeStaleMobileNavLayers();
  }, []);

  useEffect(() => {
    if (!isMenuOpen && !accountOpen) {
      purgeStaleMobileNavLayers();
    }
  }, [isMenuOpen, accountOpen]);

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
    if (!isMenuOpen && !accountOpen) {
      releaseMobileNavBodyLock();
      return;
    }
    applyMobileNavBodyLock();
    return () => releaseMobileNavBodyLock();
  }, [isMenuOpen, accountOpen]);

  return {
    isMenuOpen,
    setIsMenuOpen,
    drawerOpen: isMenuOpen,
    accountOpen,
    toggleMenu,
    openMenu,
    closeMenu,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
    toggleAccount,
    closeAccount,
    closeAll,
    setAccountOpen,
  };
}
