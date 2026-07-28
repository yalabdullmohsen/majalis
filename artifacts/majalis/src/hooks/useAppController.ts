/**
 * React binding for `AppController` + lifecycle side-effects
 * (keep-awake, immersive System UI).
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createAppController,
  getAppController,
  type AppController,
  type AppControllerSnapshot,
} from "@/lib/app-controller";
import { useKeepAwake } from "@/hooks/useKeepAwake";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";

export type UseAppControllerResult = AppControllerSnapshot & {
  controller: AppController;
  setKeepAwake: (v: boolean) => void;
  setOrientation: (o: AppControllerSnapshot["orientation"]) => void;
  enterImmersive: (paperBg?: string) => Promise<void>;
  exitImmersive: () => Promise<void>;
};

/**
 * @param opts.external — shared controller instance
 * @param opts.singleton — use process-wide singleton (default false)
 * @param opts.autoImmersive — drive System UI from controller.immersive
 */
export function useAppController(opts?: {
  external?: AppController;
  singleton?: boolean;
  autoImmersive?: boolean;
}): UseAppControllerResult {
  const controller = useMemo(() => {
    if (opts?.external) return opts.external;
    if (opts?.singleton) return getAppController();
    return createAppController();
  }, [opts?.external, opts?.singleton]);

  const snap = useSyncExternalStore(
    (cb) => controller.subscribe(cb),
    () => controller.getSnapshot(),
    () => controller.getSnapshot(),
  );

  useKeepAwake(snap.keepAwake);

  const autoImmersive = opts?.autoImmersive ?? true;
  useImmersiveSystemUi(autoImmersive && snap.immersive, snap.paperBg);

  useEffect(() => {
    return () => {
      if (controller.immersive) void controller.exitImmersive();
    };
  }, [controller]);

  return {
    ...snap,
    controller,
    setKeepAwake: (v) => controller.setKeepAwake(v),
    setOrientation: (o) => controller.setOrientation(o),
    enterImmersive: (bg) => controller.enterImmersive(bg),
    exitImmersive: () => controller.exitImmersive(),
  };
}

export default useAppController;
