"use client";

import { Router as WouterRouter } from "wouter";
import AppRoutes from "@/components/AppRoutes";
import { useNextLocation } from "@/hooks/useNextLocation";

export default function CatchAllClient() {
  return (
    <WouterRouter hook={useNextLocation}>
      <AppRoutes />
    </WouterRouter>
  );
}
