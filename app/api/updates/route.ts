import { NextResponse } from "next/server";
import fallbackUpdates from "./fallback.json";

type IosUpdateItem = {
  id: string;
  title: string;
  content: string;
};

/**
 * GET /api/updates
 * يُرجع أحدث التحديثات بصيغة JSON لتطبيق الآيفون (UpdatesView).
 * الشكل المتوقع: [{ id, title, content }, ...]
 */
export async function GET() {
  try {
    const updates = await loadLatestUpdates();

    return NextResponse.json(updates, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });
  }
}

async function loadLatestUpdates(): Promise<IosUpdateItem[]> {
  const fromDb = await fetchFromSupabase();
  if (fromDb.length > 0) return fromDb;
  return fallbackUpdates as IosUpdateItem[];
}

async function fetchFromSupabase(): Promise<IosUpdateItem[]> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  try {
    const endpoint = new URL("/rest/v1/platform_updates", url);
    endpoint.searchParams.set(
      "select",
      "id,title,summary,body,published_at,status",
    );
    endpoint.searchParams.set("status", "eq.approved");
    endpoint.searchParams.set("order", "published_at.desc");
    endpoint.searchParams.set("limit", "40");

    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const rows = (await res.json()) as Array<{
      id?: string;
      title?: string;
      summary?: string;
      body?: string;
    }>;

    return rows
      .map((row) => ({
        id: String(row.id || "").trim(),
        title: String(row.title || "").trim(),
        content: String(row.summary || row.body || row.title || "").trim(),
      }))
      .filter((row) => row.id && row.title && row.content);
  } catch {
    return [];
  }
}
