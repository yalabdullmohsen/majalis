import { Router, type IRouter } from "express";
import Expo, { type ExpoPushMessage } from "expo-server-sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  RegisterPushTokenBody,
  SendNotificationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const expo = new Expo();

// ---------------------------------------------------------------------------
// Supabase client — used to verify admin JWTs from mobile admin actions
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/** Verify a Supabase Bearer JWT and confirm the user has the admin role. */
async function verifyAdminJwt(authHeader: string | undefined): Promise<boolean> {
  if (!supabase || !authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return profile?.role === "admin";
}

// ---------------------------------------------------------------------------
// Durable token store (JSON file, survives server restarts)
// ---------------------------------------------------------------------------

const __dir = path.dirname(fileURLToPath(import.meta.url));
// Resolves to artifacts/api-server/data/ from the compiled dist/ directory
const DATA_DIR = path.resolve(__dir, "../data");
const TOKENS_FILE = path.join(DATA_DIR, "push-tokens.json");

interface TokenEntry {
  token: string;
  userId?: string;
  platform: string;
  registeredAt: string;
}

type TokenStore = Record<string, TokenEntry>;

async function loadTokens(): Promise<TokenStore> {
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf-8");
    return JSON.parse(raw) as TokenStore;
  } catch {
    return {};
  }
}

async function saveTokens(store: TokenStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TOKENS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Internal push dispatch (reused by both /trigger and /send)
// ---------------------------------------------------------------------------

const PRESSURE_COPY =
  /فاتك|ارجع الآن|آخر فرصة|لماذا توقفت|لدينا شيء|لا تفوّت|عاجل|!!!|FOMO|last chance/i;

const ALLOWED_DEEP_LINK_PREFIXES = [
  "/lesson/",
  "/lessons/",
  "/series/",
  "/path/",
  "/paths/",
  "/course/",
  "/courses/",
  "/world/",
  "/worlds/",
  "/category/",
  "/categories/",
  "/mushaf",
  "/quran",
  "/adhkar",
  "/adhan",
  "/prayer",
  "/settings",
  "/notification-settings",
  "/account",
  "/updates",
  "/home",
] as const;

const ALLOWED_PUSH_CHANNELS = new Set([
  "new_content",
  "product_updates",
  "operational",
]);

function sanitizeDeepLink(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > 512) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  if (!raw.startsWith("/") || raw.includes("..") || raw.includes("//")) return null;
  if (/[\s<>"']/.test(raw)) return null;
  return ALLOWED_DEEP_LINK_PREFIXES.some((p) => raw === p || raw.startsWith(p))
    ? raw
    : null;
}

function sanitizePushData(
  data: Record<string, unknown> | undefined,
): { ok: true; data?: Record<string, unknown> } | { ok: false; error: string } {
  if (!data) return { ok: true };
  const next: Record<string, unknown> = { ...data };
  if ("channel" in next) {
    const ch = String(next.channel || "");
    if (!ALLOWED_PUSH_CHANNELS.has(ch)) {
      return { ok: false, error: "Unsupported or disallowed push channel" };
    }
  }
  for (const key of ["url", "deepLink", "path"] as const) {
    if (key in next) {
      const safe = sanitizeDeepLink(next[key]);
      if (!safe) return { ok: false, error: `Invalid deep link in data.${key}` };
      next[key] = safe;
    }
  }
  return { ok: true, data: next };
}

function validateSendPayload(input: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userIds?: string[];
  confirmBroadcast?: boolean;
}): { ok: true; data?: Record<string, unknown>; userIds: string[] } | { ok: false; error: string } {
  if (PRESSURE_COPY.test(input.title) || PRESSURE_COPY.test(input.body)) {
    return { ok: false, error: "Pressure / manipulative copy is not allowed" };
  }
  const userIds = (input.userIds ?? []).map((id) => String(id).trim()).filter(Boolean);
  const broadcast = input.confirmBroadcast === true;
  if (userIds.length === 0 && !broadcast) {
    return {
      ok: false,
      error: "userIds required; set confirmBroadcast=true only for intentional broadcast",
    };
  }
  const dataResult = sanitizePushData(input.data);
  if (!dataResult.ok) return dataResult;
  return { ok: true, data: dataResult.data, userIds };
}

async function dispatchPushNotifications(payload: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userIds: string[];
  broadcast?: boolean;
}): Promise<{ sent: number; errors: number; pruned: number }> {
  const { title, body, data, userIds, broadcast } = payload;
  const store = await loadTokens();

  const targets: TokenEntry[] = Object.values(store).filter((entry) => {
    if (broadcast && userIds.length === 0) return true;
    return userIds.includes(entry.userId ?? "");
  });

  if (targets.length === 0) return { sent: 0, errors: 0, pruned: 0 };

  const messages: ExpoPushMessage[] = targets.map((entry) => ({
    to: entry.token,
    title,
    body,
    data,
    sound: "default" as const,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let errors = 0;
  const invalidTokens = new Set<string>();

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]!;
        if (ticket.status === "ok") {
          sent++;
          continue;
        }
        errors++;
        const errDetails = (ticket as { details?: { error?: string } }).details?.error;
        if (
          errDetails === "DeviceNotRegistered" ||
          errDetails === "InvalidCredentials" ||
          errDetails === "MismatchSenderId"
        ) {
          const token = chunk[i]?.to;
          if (typeof token === "string") invalidTokens.add(token);
        }
      }
    } catch {
      errors += chunk.length;
    }
  }

  let pruned = 0;
  if (invalidTokens.size > 0) {
    for (const token of invalidTokens) {
      if (store[token]) {
        delete store[token];
        pruned++;
      }
    }
    if (pruned > 0) await saveTokens(store);
  }

  return { sent, errors, pruned };
}

// ---------------------------------------------------------------------------
// Simple rate limiter — per-IP, 20 req / 60 s for the trigger endpoint
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Register an Expo push token for a device.
 * Called by the mobile app on launch after permission is granted.
 * No auth required — the token itself identifies the device.
 */
router.post("/notifications/register", async (req, res) => {
  const parsed = RegisterPushTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { token, userId, platform } = parsed.data;

  if (!Expo.isExpoPushToken(token)) {
    res.status(400).json({ error: "Invalid Expo push token" });
    return;
  }

  const store = await loadTokens();
  store[token] = { token, userId, platform, registeredAt: new Date().toISOString() };
  await saveTokens(store);

  res.json({ success: true, message: "Token registered" });
});

/**
 * Trigger a push notification from a trusted admin action.
 * Requires a valid Supabase JWT (Authorization: Bearer <token>) from a user
 * with role="admin" in the profiles table.
 * This is the only path mobile admin screens use — no client-side secret needed.
 */
router.post("/notifications/trigger", async (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] ?? (req.socket as any).remoteAddress ?? "unknown");

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const isAdmin = await verifyAdminJwt(req.headers["authorization"] as string | undefined);
  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }

  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, body, data, userIds } = parsed.data;
  const validated = validateSendPayload({
    title,
    body,
    data: data as Record<string, unknown> | undefined,
    userIds,
    confirmBroadcast: Boolean((req.body as { confirmBroadcast?: unknown })?.confirmBroadcast),
  });
  if (!validated.ok) {
    res.status(400).json({ error: validated.error });
    return;
  }

  const result = await dispatchPushNotifications({
    title,
    body,
    data: validated.data,
    userIds: validated.userIds,
    broadcast: validated.userIds.length === 0,
  });

  res.json({ success: true, ...result });
});

/**
 * Send a push notification via a pre-shared server-side secret.
 * Intended for use by Supabase Database Webhooks or other server-side callers.
 * The NOTIFICATION_SECRET env var must be set; if absent, this endpoint is disabled.
 */
router.post("/notifications/send", async (req, res) => {
  const secret = process.env.NOTIFICATION_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Notification send endpoint not configured" });
    return;
  }

  const auth = req.headers["authorization"];
  if (typeof auth !== "string" || auth !== `Bearer ${secret}`) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, body, data, userIds } = parsed.data;
  const validated = validateSendPayload({
    title,
    body,
    data: data as Record<string, unknown> | undefined,
    userIds,
    confirmBroadcast: Boolean((req.body as { confirmBroadcast?: unknown })?.confirmBroadcast),
  });
  if (!validated.ok) {
    res.status(400).json({ error: validated.error });
    return;
  }

  const result = await dispatchPushNotifications({
    title,
    body,
    data: validated.data,
    userIds: validated.userIds,
    broadcast: validated.userIds.length === 0,
  });

  res.json({ success: true, ...result });
});

/** Unlink a device token on logout / privacy preference. */
router.post("/notifications/unregister", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!token || !Expo.isExpoPushToken(token)) {
    res.status(400).json({ error: "Invalid Expo push token" });
    return;
  }
  const store = await loadTokens();
  if (store[token]) {
    delete store[token];
    await saveTokens(store);
  }
  res.json({ success: true });
});

export default router;
