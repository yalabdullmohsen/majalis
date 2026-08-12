import { adminFetch } from "@/lib/admin-api";

async function postMke(body: Record<string, unknown>) {
  const res = await adminFetch("/api/admin/majlis-knowledge-engine", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getMkeDashboard() {
  return postMke({ action: "dashboard" });
}

export async function getMkeHealth() {
  return postMke({ action: "health" });
}

export async function runMkeEngine(mode = "full") {
  return postMke({ action: "run", mode });
}

export async function listMkeSources(activeOnly = true) {
  return postMke({ action: "list-sources", activeOnly });
}

export async function upsertMkeSource(source: Record<string, unknown>) {
  return postMke({ action: "upsert-source", source });
}
