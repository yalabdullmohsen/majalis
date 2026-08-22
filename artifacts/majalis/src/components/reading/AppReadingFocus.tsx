import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  collectReadingFocusTargets,
  isReadingFocusExcludedPath,
  setReadingFocusState,
} from "@/lib/reading-focus";
import { reducedMotionPreferred } from "@/lib/spatial-nav";
import "@/styles/components/app-reading-focus.css";

const ACTIVE_ROOT_MARGIN = "-38% 0px -38% 0px";
const NEAR_ROOT_MARGIN = "-12% 0px -12% 0px";
const RESCAN_DEBOUNCE_MS = 280;

/**
 * تركيز قراءة تفاعلي عبر IntersectionObserver — بدون scroll listeners.
 * يُعطَّل تلقائياً على مسارات المصحف وعارض القرآن.
 */
export function AppReadingFocus() {
  const [location] = useLocation();
  const targetsRef = useRef<HTMLElement[]>([]);
  const activeRef = useRef<Set<Element>>(new Set());
  const nearRef = useRef<Set<Element>>(new Set());
  const activeObserverRef = useRef<IntersectionObserver | null>(null);
  const nearObserverRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const rescanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;

    const disabled =
      isReadingFocusExcludedPath(location) || reducedMotionPreferred();

    document.documentElement.classList.toggle("app-reading-focus-enabled", !disabled);
    document.documentElement.classList.toggle("app-reading-focus-off", disabled);

    const cleanup = () => {
      if (rescanTimerRef.current != null) {
        window.clearTimeout(rescanTimerRef.current);
        rescanTimerRef.current = null;
      }
      activeObserverRef.current?.disconnect();
      nearObserverRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
      activeObserverRef.current = null;
      nearObserverRef.current = null;
      mutationObserverRef.current = null;
      activeRef.current.clear();
      nearRef.current.clear();
      for (const el of targetsRef.current) {
        el.classList.remove("app-focus-active", "app-focus-near", "app-focus-idle");
      }
      targetsRef.current = [];
      document.documentElement.style.removeProperty("--app-reading-progress");
      document.documentElement.classList.remove(
        "app-reading-focus-enabled",
        "app-reading-focus-off",
      );
    };

    if (disabled) {
      cleanup();
      return cleanup;
    }

    const updateReadingProgress = () => {
      const targets = targetsRef.current;
      const tall = main.scrollHeight > main.clientHeight * 1.35;
      if (!tall || targets.length < 4) {
        document.documentElement.style.removeProperty("--app-reading-progress");
        return;
      }
      let index = 0;
      for (let i = 0; i < targets.length; i += 1) {
        if (activeRef.current.has(targets[i])) {
          index = i;
          break;
        }
        if (nearRef.current.has(targets[i])) index = i;
      }
      const ratio = targets.length > 1 ? index / (targets.length - 1) : 0;
      document.documentElement.style.setProperty("--app-reading-progress", ratio.toFixed(4));
    };

    const applyStates = () => {
      for (const el of targetsRef.current) {
        if (activeRef.current.has(el)) setReadingFocusState(el, "active");
        else if (nearRef.current.has(el)) setReadingFocusState(el, "near");
        else setReadingFocusState(el, "idle");
      }
      updateReadingProgress();
    };

    const onActive = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeRef.current.add(entry.target);
        else activeRef.current.delete(entry.target);
      }
      applyStates();
    };

    const onNear = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) nearRef.current.add(entry.target);
        else nearRef.current.delete(entry.target);
      }
      applyStates();
    };

    const mountObservers = (targets: HTMLElement[]) => {
      activeObserverRef.current?.disconnect();
      nearObserverRef.current?.disconnect();
      activeRef.current.clear();
      nearRef.current.clear();

      targetsRef.current = targets;
      if (!targets.length) {
        document.documentElement.style.removeProperty("--app-reading-progress");
        return;
      }

      const activeObserver = new IntersectionObserver(onActive, {
        root: null,
        rootMargin: ACTIVE_ROOT_MARGIN,
        threshold: 0.08,
      });
      const nearObserver = new IntersectionObserver(onNear, {
        root: null,
        rootMargin: NEAR_ROOT_MARGIN,
        threshold: 0.05,
      });

      for (const el of targets) {
        setReadingFocusState(el, "idle");
        activeObserver.observe(el);
        nearObserver.observe(el);
      }

      activeObserverRef.current = activeObserver;
      nearObserverRef.current = nearObserver;
    };

    const scan = () => {
      const targets = collectReadingFocusTargets(main);
      const prev = targetsRef.current;
      const same =
        prev.length === targets.length &&
        prev.every((el, i) => el === targets[i]);
      if (!same) mountObservers(targets);
    };

    const scheduleScan = () => {
      if (rescanTimerRef.current != null) {
        window.clearTimeout(rescanTimerRef.current);
      }
      rescanTimerRef.current = window.setTimeout(() => {
        rescanTimerRef.current = null;
        scan();
      }, RESCAN_DEBOUNCE_MS);
    };

    scan();

    mutationObserverRef.current = new MutationObserver(scheduleScan);
    mutationObserverRef.current.observe(main, { childList: true, subtree: true });

    return cleanup;
  }, [location]);

  return (
    <div
      className="app-reading-progress"
      aria-hidden="true"
      data-testid="app-reading-progress"
    />
  );
}
