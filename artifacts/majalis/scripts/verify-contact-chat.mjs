#!/usr/bin/env node
/**
 * Contact chat system verification
 * Usage: node scripts/verify-contact-chat.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const REQUIRED = [
  "supabase/contact_chat_v1.sql",
  "lib/api-handlers/contact-chat.js",
  "src/views/ContactChatPage.tsx",
  "src/views/admin/ContactChatSection.tsx",
  "src/components/ContactChatFloatingButton.tsx",
  "src/components/ContactChatReportButton.tsx",
  "src/lib/contact-chat.ts",
];

const checks = [];

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  checks.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function mockRes() {
  const state = { status: 200, body: null };
  return {
    statusCode: 200,
    set status(v) {
      state.status = v;
    },
    end() {},
    get state() {
      return state;
    },
  };
}

async function readJson(res) {
  return new Promise((resolve) => {
    const chunks = [];
    const r = {
      statusCode: 200,
      status(v) {
        this.statusCode = v;
      },
      json(data) {
        resolve({ status: this.statusCode, data });
      },
      end() {
        resolve({ status: this.statusCode, data: null });
      },
    };
    return r;
  });
}

function createMockRes() {
  let status = 200;
  let payload = null;
  return {
    get statusCode() {
      return status;
    },
    set statusCode(v) {
      status = v;
    },
    end() {},
    _result: () => ({ status, payload }),
    json: undefined,
  };
}

// sendJson uses res.statusCode and res.end with body written via custom sendJson
import { pathToFileURL } from "node:url";

async function invokeHandler(action, { method = "GET", body, query = {}, headers = {} } = {}) {
  const handler = (await import(pathToFileURL(path.join(ROOT, "lib/api-handlers/contact-chat.js")).href)).default;
  let payload = null;
  const req = {
    method,
    headers,
    query: { action, ...query },
    body,
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    statusCode: 200,
    setHeader() {},
    end(data) {
      if (data) {
        try {
          payload = JSON.parse(data);
        } catch {
          payload = data;
        }
      }
    },
  };
  if (method === "POST" && body) {
    req.on = async function* () {
      yield JSON.stringify(body);
    };
  }
  await handler(req, res);
  return { status: res.statusCode, data: payload };
}

console.log("\n=== Contact Chat Verification ===\n");

for (const rel of REQUIRED) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) pass(`file: ${rel}`);
  else fail(`file: ${rel}`, "missing");
}

const appTsx = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
if (appTsx.includes("/contact-chat") && appTsx.includes("ContactChatFloatingButton")) {
  pass("route + FAB in App.tsx");
} else fail("route + FAB in App.tsx");

const nav = fs.readFileSync(path.join(ROOT, "src/lib/navigation.ts"), "utf8");
if (nav.includes('href: "/contact-chat"') && nav.includes("تواصل")) {
  pass("navigation.ts — تواصل link");
} else fail("navigation.ts");

const adminNav = fs.readFileSync(path.join(ROOT, "src/lib/admin-navigation.ts"), "utf8");
if (adminNav.includes("contact-chat")) pass("admin navigation");
else fail("admin navigation");

const sql = fs.readFileSync(path.join(ROOT, "supabase/contact_chat_v1.sql"), "utf8");
for (const table of ["contact_threads", "contact_messages", "contact_attachments", "contact_thread_events", "contact_internal_notes"]) {
  if (sql.includes(table)) pass(`sql table: ${table}`);
  else fail(`sql table: ${table}`);
}

console.log("\n--- API smoke (memory fallback) ---\n");

try {
  const created = await invokeHandler("create_thread", {
    method: "POST",
    body: {
      action: "create_thread",
      message_type: "اقتراح",
      message: "اختبار نظام التواصل الداخلي",
      guest_name: "زائر",
    },
  });
  if (created.data?.ok && created.data.thread?.id) {
    pass("create_thread", created.data.source || "ok");
    const threadId = created.data.thread.id;
    const token = created.data.access_token;

    const listed = await invokeHandler("threads", { query: { token } });
    if (listed.data?.ok && listed.data.threads?.length >= 1) pass("threads by token");
    else fail("threads by token");

    const msgs = await invokeHandler("messages", { query: { thread_id: threadId, token } });
    if (msgs.data?.ok && msgs.data.messages?.length >= 1) pass("messages list");
    else fail("messages list");

    const sent = await invokeHandler("send", {
      method: "POST",
      body: { action: "send", thread_id: threadId, token, message: "متابعة من الزائر" },
    });
    if (sent.data?.ok) pass("user send message");
    else fail("user send message");

    const closed = await invokeHandler("user_update_thread", {
      method: "POST",
      body: { action: "user_update_thread", thread_id: threadId, token, status: "مغلقة" },
    });
    if (closed.data?.ok && closed.data.thread?.status === "مغلقة") pass("user close thread");
    else fail("user close thread");

    const reopened = await invokeHandler("user_update_thread", {
      method: "POST",
      body: { action: "user_update_thread", thread_id: threadId, token, status: "مفتوحة" },
    });
    if (reopened.data?.ok) pass("user reopen thread");
    else fail("user reopen thread");

    const forbidden = await invokeHandler("threads", { query: { token: "invalid-token-xyz" } });
    if (forbidden.data?.ok && forbidden.data.threads?.length === 0) pass("token isolation");
    else if (!forbidden.data?.ok) pass("token isolation", "401/empty");
    else fail("token isolation", "unexpected access");
  } else {
    fail("create_thread", JSON.stringify(created.data));
  }
} catch (err) {
  fail("API smoke", err.message);
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n=== ${checks.length - failed.length}/${checks.length} passed ===\n`);
process.exit(failed.length ? 1 : 0);
