import { supabase } from "@/lib/supabase";

export interface ClientErrorLogRow {
  id: string;
  error_id: string;
  message: string;
  name: string | null;
  component: string | null;
  route: string | null;
  section: string | null;
  device_type: string | null;
  build_version: string | null;
  commit_hash: string | null;
  created_at: string;
}

export async function fetchRecentErrorLogs(limit = 100): Promise<ClientErrorLogRow[]> {
  const { data, error } = await supabase
    .from("client_error_logs")
    .select("id, error_id, message, name, component, route, section, device_type, build_version, commit_hash, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as ClientErrorLogRow[];
}

export interface RouteErrorCount {
  route: string;
  count: number;
}

/** يجمع الأخطاء حسب المسار من الوقائع الخام مباشرة — لا يُخزَّن تجميع جاهز. */
export function groupErrorsByRoute(logs: ClientErrorLogRow[]): RouteErrorCount[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    const route = log.route || "غير معروف";
    map.set(route, (map.get(route) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count);
}
