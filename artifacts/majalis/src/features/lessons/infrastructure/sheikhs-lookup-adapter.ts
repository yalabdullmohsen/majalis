import { getSheikhs } from "@/lib/supabase";
import type { SheikhsLookupPort, SheikhLookupRow } from "../domain/ports";

export function createSheikhsLookupAdapter(): SheikhsLookupPort {
  return {
    async list() {
      const { data } = await getSheikhs();
      return { data: (data || []) as SheikhLookupRow[] };
    },
  };
}
