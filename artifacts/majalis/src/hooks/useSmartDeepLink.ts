import { useCallback, useEffect, useState } from "react";
import {
  applyDeepLinkFromLocation,
  applyDeepLinkTarget,
  encodeDeepLink,
  parseDeepLink,
  type DeepLinkApplyResult,
  type DeepLinkTarget,
  type ParsedDeepLink,
} from "@/lib/smart-deep-link";

/** Smart deep-linking — logic only (no layout/CSS). */
export function useSmartDeepLink(opts?: {
  autoApply?: boolean;
  container?: HTMLElement | null;
  delayMs?: number;
}) {
  const [target, setTarget] = useState<ParsedDeepLink | null>(() => parseDeepLink());
  const [result, setResult] = useState<DeepLinkApplyResult | null>(null);

  const refresh = useCallback(() => {
    const next = parseDeepLink();
    setTarget(next);
    return next;
  }, []);

  const apply = useCallback(
    (t?: DeepLinkTarget | ParsedDeepLink) => {
      const resolved = t || parseDeepLink();
      if (!resolved) {
        const empty: DeepLinkApplyResult = {
          ok: false,
          target: null,
          scrolled: false,
          highlighted: false,
        };
        setResult(empty);
        return empty;
      }
      const applied = applyDeepLinkTarget(resolved, { container: opts?.container });
      setTarget(applied.target);
      setResult(applied);
      return applied;
    },
    [opts?.container],
  );

  const encode = useCallback((t: DeepLinkTarget) => encodeDeepLink(t), []);

  useEffect(() => {
    if (opts?.autoApply === false) return;
    const delay = opts?.delayMs ?? 120;
    const timer = window.setTimeout(() => {
      const applied = applyDeepLinkFromLocation({ container: opts?.container });
      setTarget(applied.target);
      setResult(applied);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [opts?.autoApply, opts?.container, opts?.delayMs]);

  return { target, result, refresh, apply, encode, parse: parseDeepLink };
}
