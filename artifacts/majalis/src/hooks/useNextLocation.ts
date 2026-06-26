"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Bridges wouter to Next.js App Router navigation. */
export function useNextLocation(): [string, (to: string) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = useCallback(
    (to: string) => {
      router.push(to);
    },
    [router],
  );
  return [pathname ?? "/", navigate];
}
