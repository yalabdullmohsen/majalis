/**
 * Open Platform — API key auth, scopes, OAuth stub.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { API_SCOPES, ERROR_CODES } from "./config.mjs";

function safeEqual(a, b) {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(prefix = "maj") {
  const raw = `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 12) };
}

export function extractApiKey(req) {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.headers?.["x-api-key"] || req.query?.api_key || null;
}

export async function validateApiKey(req, { requiredScope, resource } = {}) {
  const key = extractApiKey(req);

  if (!key) {
    return { ok: false, error: ERROR_CODES.UNAUTHORIZED, keyRecord: null };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    if (process.env.NODE_ENV !== "production" && key.startsWith("maj_dev_")) {
      return {
        ok: true,
        keyRecord: { id: "dev", name: "Development", tier: "free", scopes: ["read", "search"], key_prefix: "maj_dev_" },
      };
    }
    return { ok: false, error: ERROR_CODES.UNAUTHORIZED, keyRecord: null };
  }

  try {
    const keyHash = hashKey(key);
    const { data: keyRecord } = await admin
      .from("open_api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (!keyRecord) {
      return { ok: false, error: ERROR_CODES.UNAUTHORIZED, keyRecord: null };
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { ok: false, error: { ...ERROR_CODES.UNAUTHORIZED, message: "API key expired" }, keyRecord: null };
    }

    const scopes = keyRecord.scopes || ["read"];
    if (requiredScope && !scopes.includes("admin") && !scopes.includes(requiredScope)) {
      return { ok: false, error: ERROR_CODES.FORBIDDEN, keyRecord };
    }

    if (resource && !scopes.includes("admin")) {
      const scopeResources = scopes.flatMap((s) => API_SCOPES[s]?.resources || []);
      if (!scopeResources.includes("*") && !scopeResources.includes(resource)) {
        return { ok: false, error: ERROR_CODES.FORBIDDEN, keyRecord };
      }
    }

    await admin
      .from("open_api_keys")
      .update({ last_used_at: new Date().toISOString(), usage_count: (keyRecord.usage_count || 0) + 1 })
      .eq("id", keyRecord.id);

    return { ok: true, keyRecord };
  } catch {
    return { ok: false, error: ERROR_CODES.UNAUTHORIZED, keyRecord: null };
  }
}

export async function createApiKey(admin, { name, scopes = ["read", "search"], tier = "free", owner_id, expires_at }) {
  if (!admin) return { ok: false, error: "no_admin" };

  const { raw, hash, prefix } = generateApiKey();
  const { data, error } = await admin
    .from("open_api_keys")
    .insert({
      name,
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      tier,
      owner_id,
      expires_at,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, key: raw, record: data };
}

export async function revokeApiKey(admin, keyId) {
  if (!admin) return { ok: false };
  await admin.from("open_api_keys").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", keyId);
  return { ok: true };
}

export async function listApiKeys(admin, ownerId) {
  if (!admin) return [];
  const { data } = await admin.from("open_api_keys").select("id, name, key_prefix, scopes, tier, is_active, usage_count, last_used_at, created_at").eq("owner_id", ownerId || "admin");
  return data || [];
}

/** OAuth 2.0 stub — client credentials flow for partners */
export async function validateOAuthToken(req) {
  const token = extractApiKey(req);
  if (!token?.startsWith("oauth_")) return { ok: false };
  return validateApiKey(req);
}

export { hashKey, safeEqual };
