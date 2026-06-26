"use client";

import { Router as WouterRouter } from "wouter";
import AppRoutes from "@/components/AppRoutes";
import { useNextLocation } from "@/hooks/useNextLocation";

export const dynamic = "force-dynamic";

export default function CatchAllPage() {
  return (
    <WouterRouter hook={useNextLocation}>
      <AppRoutes />
    </WouterRouter>
  );
}
