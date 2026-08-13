import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import {
  classifyNavMotion,
  NAV_MOTION_MS,
  reducedMotionPreferred,
  type NavMotionKind,
} from "@/lib/spatial-nav";

const MOTION_CLASSES: Record<Exclude<NavMotionKind, "none">, string> = {
  push: "mj-route-push",
  pop: "mj-route-pop",
  tab: "mj-route-tab",
  modal: "mj-route-modal",
};

/**
 * انتقالات مكانية على #main-content (transform + opacity فقط).
 * push: دخول من اليمين · pop: كشف من اليسار · tab: خفوت · modal: من الأسفل.
 */
export function RouteEnterMotion() {
  const [location] = useLocation();
  const isPopRef = useRef(false);
  const first = useRef(true);
  const prevLocationRef = useRef(location);

  useLayoutEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    const from = prevLocationRef.current;
    prevLocationRef.current = location;

    if (!main) return;
    if (first.current) {
      first.current = false;
      isPopRef.current = false;
      return;
    }

    const wasPop = isPopRef.current;
    isPopRef.current = false;

    if (isImmersiveChromePath(location) || reducedMotionPreferred()) {
      clearMotion(main);
      return;
    }

    const kind = classifyNavMotion(from, location, wasPop);
    if (kind === "none") {
      clearMotion(main);
      return;
    }

    const cls = MOTION_CLASSES[kind];
    clearMotion(main);
    void main.offsetWidth;
    main.classList.add(cls);
    document.documentElement.dataset.navMotion = kind;

    const ms = NAV_MOTION_MS[kind] + 40;
    const t = window.setTimeout(() => {
      main.classList.remove(cls);
      if (document.documentElement.dataset.navMotion === kind) {
        delete document.documentElement.dataset.navMotion;
      }
    }, ms);

    return () => {
      window.clearTimeout(t);
    };
  }, [location]);

  return null;
}

/** اسم بديل للتوثيق — نفس المكوّن. */
export const SpatialRouteTransition = RouteEnterMotion;

function clearMotion(main: HTMLElement) {
  main.classList.remove(
    "mj-route-enter",
    "mj-route-push",
    "mj-route-pop",
    "mj-route-tab",
    "mj-route-modal",
  );
  main.style.transform = "";
  main.style.opacity = "";
  main.style.transition = "";
  delete document.documentElement.dataset.navMotion;
}
