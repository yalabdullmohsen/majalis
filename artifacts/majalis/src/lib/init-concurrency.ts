/**
 * Part 8 concurrency boot — idle scheduling, hibernation, locks warm-up.
 */

import { ensureHibernationBinding } from "@/lib/background-hibernation";
import { runWhenIdle } from "@/lib/idle-defer";

let booted = false;

export function initConcurrencyLayer(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  ensureHibernationBinding();

  // Soft-warm platform logic pieces during idle (non-blocking)
  runWhenIdle(
    () => {
      void import("@/lib/platform-logic-bootstrap")
        .then((m) => m.startPlatformLogicSuite())
        .catch(() => undefined);
    },
    { timeoutMs: 6_000, requireVisible: true, label: "platform-logic-idle" },
  );
}
