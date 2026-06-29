import { sendJson } from "../api/_http.mjs";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { checkRateLimit } from "../../lib/rate-limit.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { randomBytes, randomUUID } from "node:crypto";

const SUBMIT_RL = { windowMs: 3600_000, max: 15, keyPrefix: "contact-chat" };
const MSG_RL = { windowMs: 60_000, max: 20, keyPrefix: "contact-chat-msg" };

const MESSAGE_TYPES = new Set([
  "اقتراح", "شكوى", "بلاغ خطأ", "تصحيح معلومة", "طلب إضافة محتوى", "مشكلة تقنية", "أخرى",
]);
const STATUSES = new Set([
  "جديدة", "مفتوحة", "بانتظار رد المستخدم", "بانتظار رد الإدارة", "مغلقة", "مؤرشفة",
]);
const PRIORITIES = new Set(["منخفضة", "عادية", "عالية", "حرجة"]);
const MAX_BODY = 8000;
const MAX_ATTACH = 512_000;

/** In-memory fallback */
const mem = { threads: [], messages: [], attachments: [], notes: [], events: [] };

function uid(prefix = "t") {
  return `${prefix}-${randomBytes(12).toString("hex")}`;
}

function newId() {
  return randomUUID();
}

function sanitizeText(text, max = MAX_BODY) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, max);
}

function autoPriority(messageType, body) {
  const t = `${messageType} ${body}`;
  if (messageType === "بلاغ خطأ" || messageType === "تصحيح معلومة" || /آية|حديث|قرآن|فتوى|شرع/i.test(t)) {
    return "عالية";
  }
  if (messageType === "شكوى" || messageType === "مشكلة تقنية") return "عادية";
  return "منخفضة";
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.on !== "function") return {};
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getOptionalUser(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) return null;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const client = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
}

function canAccessThread(thread, { userId, token }) {
  if (token && thread.access_token === token) return true;
  if (userId && thread.user_id === userId) return true;
  return false;
}

async function saveAttachments(adminClient, threadId, messageId, rawAtt, now) {
  const attachments = [];
  if (!Array.isArray(rawAtt)) return attachments;
  for (const a of rawAtt.slice(0, 3)) {
    const dataUrl = String(a.data_url || a.dataUrl || "");
    if (!dataUrl || dataUrl.length > MAX_ATTACH) continue;
    const mime = sanitizeText(a.mime_type || a.mimeType || "application/octet-stream", 80);
    if (!/^(image\/(jpeg|png|gif|webp)|application\/pdf|text\/plain)/i.test(mime)) continue;
    attachments.push({
      id: newId(),
      message_id: messageId,
      thread_id: threadId,
      file_name: sanitizeText(a.file_name || a.fileName || "file", 120),
      mime_type: mime,
      file_size: dataUrl.length,
      data_url: dataUrl.slice(0, MAX_ATTACH),
      created_at: now,
    });
  }
  if (attachments.length && adminClient) {
    await adminClient.from("contact_attachments").insert(attachments);
  }
  return attachments;
}

async function logEvent(admin, threadId, eventType, payload, actorUserId = null) {
  const row = {
    id: newId(),
    thread_id: threadId,
    actor_user_id: actorUserId,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  };
  if (admin) {
    try {
      await admin.from("contact_thread_events").insert(row);
      return;
    } catch {
      /* fall through */
    }
  }
  mem.events.unshift({ ...row, id: uid("ev") });
}

async function insertNotification(admin, { userId, title, body, type = "contact_chat" }) {
  if (!admin || !userId) return;
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      title,
      body,
      type,
      is_read: false,
    });
  } catch {
    /* table may not exist */
  }
}

function clientIp(req) {
  return req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

async function enforceRateLimit(req, res, { windowMs, max, keyPrefix }) {
  const result = await checkRateLimit(`${keyPrefix}:${clientIp(req)}`, { windowMs, max });
  if (!result.allowed) {
    sendJson(res, 429, { ok: false, error: "rate_limited", message: "تجاوزت الحد. حاول لاحقاً." });
    return false;
  }
  return true;
}

async function createThread(req, res) {
  if (!(await enforceRateLimit(req, res, SUBMIT_RL))) return;

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, error: "invalid_json" });
    return;
  }

  const user = await getOptionalUser(req);
  const messageType = MESSAGE_TYPES.has(body.message_type) ? body.message_type : "أخرى";
  const messageBody = sanitizeText(body.message || body.body);
  if (messageBody.length < 3) {
    sendJson(res, 400, { ok: false, error: "message_short", message: "اكتب رسالة أوضح." });
    return;
  }

  const guestName = sanitizeText(body.guest_name || body.name, 120) || null;
  const guestEmail = sanitizeText(body.guest_email || body.email, 200) || null;
  if (!user && !guestName && !guestEmail) {
    /* optional for guest — allow anonymous with token only */
  }

  const now = new Date().toISOString();
  const accessToken = randomBytes(24).toString("hex");
  const priority = PRIORITIES.has(body.priority) ? body.priority : autoPriority(messageType, messageBody);
  const threadId = newId();
  const messageId = newId();
  const thread = {
    id: threadId,
    access_token: accessToken,
    user_id: user?.id || null,
    guest_name: guestName,
    guest_email: guestEmail,
    subject: sanitizeText(body.subject || messageType, 200) || messageType,
    message_type: messageType,
    status: "جديدة",
    priority,
    assigned_to: null,
    context_page_url: sanitizeText(body.context_page_url || body.page_url, 500) || null,
    context_page_type: sanitizeText(body.context_page_type, 80) || null,
    context_content_id: sanitizeText(body.context_content_id, 120) || null,
    context_content_title: sanitizeText(body.context_content_title, 300) || null,
    context_meta: body.context_meta || {},
    unread_user: 0,
    unread_admin: 1,
    last_message_at: now,
    created_at: now,
    updated_at: now,
  };

  const message = {
    id: messageId,
    thread_id: threadId,
    sender_role: "user",
    sender_user_id: user?.id || null,
    body: messageBody,
    status: "sent",
    is_internal: false,
    page_url: thread.context_page_url,
    created_at: now,
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data: t, error: te } = await admin.from("contact_threads").insert(thread).select("*").single();
      if (te) throw te;
      const { error: me } = await admin.from("contact_messages").insert({ ...message, thread_id: t.id, id: messageId });
      if (me) throw me;
      const attachments = await saveAttachments(admin, t.id, messageId, body.attachments, now);
      await logEvent(admin, t.id, "thread_created", { message_type: messageType }, user?.id);
      sendJson(res, 201, {
        ok: true,
        thread: t,
        access_token: t.access_token,
        track_url: `/contact-chat?thread=${t.id}&token=${t.access_token}`,
        attachments,
        source: "database",
      });
      return;
    } catch {
      /* memory fallback */
    }
  }

  const memThreadId = uid("thread");
  const memMessageId = uid("msg");
  const memThread = { ...thread, id: memThreadId };
  const memMessage = { ...message, id: memMessageId, thread_id: memThreadId };
  mem.threads.unshift(memThread);
  mem.messages.unshift(memMessage);
  const memAtts = await saveAttachments(null, memThreadId, memMessageId, body.attachments, now);
  if (memAtts.length) mem.attachments.push(...memAtts.map((a) => ({ ...a, id: uid("att") })));
  await logEvent(null, memThreadId, "thread_created", { message_type: messageType }, user?.id);
  sendJson(res, 201, {
    ok: true,
    thread: memThread,
    access_token: accessToken,
    track_url: `/contact-chat?thread=${memThreadId}&token=${accessToken}`,
    source: "memory",
  });
}

async function listThreads(req, res, { adminMode = false } = {}) {
  const user = await getOptionalUser(req);
  const body = req.method === "POST" ? await parseBody(req) : {};
  const token = req.query?.token || body?.token;
  const admin = getSupabaseAdmin();

  if (adminMode) {
    const auth = await requireAdminAccess(req);
    if (!auth.ok) {
      sendJson(res, auth.status || 401, { ok: false, error: auth.error });
      return;
    }
    const status = req.query?.status || body?.status;
    const type = req.query?.type || body?.type;
    const priority = req.query?.priority || body?.priority;
    const search = sanitizeText(req.query?.search || body?.search, 100);

    if (admin) {
      try {
        let q = admin.from("contact_threads").select("*").order("last_message_at", { ascending: false }).limit(100);
        if (status && status !== "all") q = q.eq("status", status);
        if (type && type !== "all") q = q.eq("message_type", type);
        if (priority && priority !== "all") q = q.eq("priority", priority);
        const { data, error } = await q;
        if (!error) {
          let rows = data || [];
          if (search) {
            rows = rows.filter(
              (t) =>
                (t.subject || "").includes(search) ||
                (t.guest_name || "").includes(search) ||
                (t.guest_email || "").includes(search),
            );
          }
          sendJson(res, 200, { ok: true, threads: rows, source: "database" });
          return;
        }
      } catch {
        /* memory */
      }
    }
    sendJson(res, 200, { ok: true, threads: mem.threads, source: "memory" });
    return;
  }

  if (user && admin) {
    try {
      const { data, error } = await admin
        .from("contact_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (!error) {
        sendJson(res, 200, { ok: true, threads: data || [], source: "database" });
        return;
      }
    } catch {
      /* memory */
    }
    const rows = mem.threads.filter((t) => t.user_id === user.id);
    sendJson(res, 200, { ok: true, threads: rows, source: "memory" });
    return;
  }

  if (token) {
    const rows = admin
      ? (await admin.from("contact_threads").select("*").eq("access_token", token).limit(20)).data
      : mem.threads.filter((t) => t.access_token === token);
    sendJson(res, 200, { ok: true, threads: rows || [], source: admin ? "database" : "memory" });
    return;
  }

  sendJson(res, 401, { ok: false, error: "auth_required", message: "سجّل الدخول أو استخدم رابط التتبع." });
}

async function getThread(req, res) {
  const threadId = req.query?.thread_id || req.query?.thread;
  const token = req.query?.token;
  const user = await getOptionalUser(req);
  const adminClient = getSupabaseAdmin();
  const isAdmin = (await requireAdminAccess(req)).ok;

  let thread = null;
  if (adminClient) {
    try {
      const { data } = await adminClient.from("contact_threads").select("*").eq("id", threadId).maybeSingle();
      thread = data;
    } catch {
      /* memory */
    }
  }
  if (!thread) thread = mem.threads.find((t) => t.id === threadId);

  if (!thread) {
    sendJson(res, 404, { ok: false, error: "not_found" });
    return;
  }

  if (!isAdmin && !canAccessThread(thread, { userId: user?.id, token })) {
    sendJson(res, 403, { ok: false, error: "forbidden" });
    return;
  }

  sendJson(res, 200, { ok: true, thread });
}

async function listMessages(req, res) {
  const threadId = req.query?.thread_id || req.query?.thread;
  const token = req.query?.token;
  const user = await getOptionalUser(req);
  const adminClient = getSupabaseAdmin();
  const isAdmin = (await requireAdminAccess(req)).ok;

  let thread = null;
  if (adminClient) {
    const { data } = await adminClient.from("contact_threads").select("*").eq("id", threadId).maybeSingle();
    thread = data;
  }
  if (!thread) thread = mem.threads.find((t) => t.id === threadId);

  if (!thread) {
    sendJson(res, 404, { ok: false, error: "not_found" });
    return;
  }
  if (!isAdmin && !canAccessThread(thread, { userId: user?.id, token })) {
    sendJson(res, 403, { ok: false, error: "forbidden" });
    return;
  }

  let messages = [];
  if (adminClient) {
    try {
      let q = adminClient
        .from("contact_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (!isAdmin) q = q.eq("is_internal", false);
      const { data } = await q;
      messages = data || [];
      const { data: atts } = await adminClient.from("contact_attachments").select("*").eq("thread_id", threadId);
      const attMap = {};
      for (const a of atts || []) {
        if (!attMap[a.message_id]) attMap[a.message_id] = [];
        attMap[a.message_id].push(a);
      }
      messages = messages.map((m) => ({ ...m, attachments: attMap[m.id] || [] }));
    } catch {
      messages = mem.messages.filter((m) => m.thread_id === threadId && (isAdmin || !m.is_internal));
    }
  } else {
    messages = mem.messages.filter((m) => m.thread_id === threadId && (isAdmin || !m.is_internal));
  }

  if (!isAdmin && user?.id === thread.user_id && adminClient) {
    await adminClient.from("contact_threads").update({ unread_user: 0 }).eq("id", threadId);
  }

  sendJson(res, 200, { ok: true, messages, thread });
}

async function sendMessage(req, res, { adminReply = false } = {}) {
  if (!(await enforceRateLimit(req, res, MSG_RL))) return;

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, error: "invalid_json" });
    return;
  }

  const threadId = body.thread_id || body.threadId;
  const token = body.token;
  const user = await getOptionalUser(req);
  const adminClient = getSupabaseAdmin();
  const auth = await requireAdminAccess(req);
  const isAdmin = auth.ok && adminReply;

  let thread = null;
  if (adminClient) {
    const { data } = await adminClient.from("contact_threads").select("*").eq("id", threadId).maybeSingle();
    thread = data;
  }
  if (!thread) thread = mem.threads.find((t) => t.id === threadId);

  if (!thread) {
    sendJson(res, 404, { ok: false, error: "not_found" });
    return;
  }

  if (thread.status === "مغلقة" || thread.status === "مؤرشفة") {
    if (!isAdmin) {
      sendJson(res, 400, { ok: false, error: "thread_closed", message: "المحادثة مغلقة." });
      return;
    }
  }

  if (!isAdmin && !canAccessThread(thread, { userId: user?.id, token })) {
    sendJson(res, 403, { ok: false, error: "forbidden" });
    return;
  }

  const text = sanitizeText(body.message || body.body);
  if (text.length < 1) {
    sendJson(res, 400, { ok: false, error: "message_empty" });
    return;
  }

  const now = new Date().toISOString();
  const messageId = newId();
  const message = {
    id: messageId,
    thread_id: threadId,
    sender_role: isAdmin ? "admin" : "user",
    sender_user_id: isAdmin ? auth.userId : user?.id || null,
    body: text,
    status: "sent",
    is_internal: Boolean(isAdmin && body.is_internal),
    page_url: sanitizeText(body.page_url, 500) || null,
    created_at: now,
  };

  const threadUpdate = {
    updated_at: now,
    last_message_at: now,
    status: isAdmin ? "بانتظار رد المستخدم" : "بانتظار رد الإدارة",
  };
  if (isAdmin) {
    threadUpdate.unread_user = (thread.unread_user || 0) + 1;
    threadUpdate.unread_admin = 0;
  } else {
    threadUpdate.unread_admin = (thread.unread_admin || 0) + 1;
    threadUpdate.unread_user = 0;
    if (thread.status === "جديدة") threadUpdate.status = "مفتوحة";
  }

  if (adminClient) {
    try {
      await adminClient.from("contact_messages").insert(message);
      const attachments = await saveAttachments(adminClient, threadId, messageId, body.attachments, now);
      await adminClient.from("contact_threads").update(threadUpdate).eq("id", threadId);
      await logEvent(adminClient, threadId, "message_sent", { role: message.sender_role }, auth.userId || user?.id);

      if (isAdmin && thread.user_id) {
        await insertNotification(adminClient, {
          userId: thread.user_id,
          title: "رد جديد على محادثتك",
          body: text.slice(0, 120),
        });
      }

      sendJson(res, 201, { ok: true, message, attachments });
      return;
    } catch {
      /* memory */
    }
  }

  const memMessage = { ...message, id: uid("msg") };
  mem.messages.push(memMessage);
  const attachments = await saveAttachments(null, threadId, memMessage.id, body.attachments, now);
  if (attachments.length) mem.attachments.push(...attachments.map((a) => ({ ...a, id: uid("att") })));
  const idx = mem.threads.findIndex((t) => t.id === threadId);
  if (idx >= 0) mem.threads[idx] = { ...mem.threads[idx], ...threadUpdate };

  sendJson(res, 201, { ok: true, message: memMessage, attachments, source: "memory" });
}

async function userUpdateThread(req, res) {
  const body = await parseBody(req);
  const threadId = body?.thread_id || body?.id;
  const token = body?.token;
  const user = await getOptionalUser(req);
  const adminClient = getSupabaseAdmin();

  let thread = null;
  if (adminClient) {
    const { data } = await adminClient.from("contact_threads").select("*").eq("id", threadId).maybeSingle();
    thread = data;
  }
  if (!thread) thread = mem.threads.find((t) => t.id === threadId);

  if (!thread || !canAccessThread(thread, { userId: user?.id, token })) {
    sendJson(res, 403, { ok: false, error: "forbidden" });
    return;
  }

  const status = body?.status;
  if (!status || !STATUSES.has(status)) {
    sendJson(res, 400, { ok: false, error: "invalid_status" });
    return;
  }
  if (!["مغلقة", "مفتوحة"].includes(status)) {
    sendJson(res, 400, { ok: false, error: "user_status_limited" });
    return;
  }

  const updates = { status, updated_at: new Date().toISOString() };
  if (status === "مغلقة") updates.closed_at = new Date().toISOString();

  if (adminClient) {
    try {
      const { data, error } = await adminClient.from("contact_threads").update(updates).eq("id", threadId).select("*").single();
      if (!error && data) {
        await logEvent(adminClient, threadId, "user_thread_updated", { status }, user?.id);
        sendJson(res, 200, { ok: true, thread: data });
        return;
      }
    } catch {
      /* memory */
    }
  }

  const idx = mem.threads.findIndex((t) => t.id === threadId);
  if (idx >= 0) {
    mem.threads[idx] = { ...mem.threads[idx], ...updates };
    sendJson(res, 200, { ok: true, thread: mem.threads[idx] });
    return;
  }
  sendJson(res, 404, { ok: false, error: "not_found" });
}

async function updateThread(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error });
    return;
  }

  const body = await parseBody(req);
  const threadId = body?.thread_id || body?.id;
  if (!threadId) {
    sendJson(res, 400, { ok: false, error: "id_required" });
    return;
  }

  const updates = { updated_at: new Date().toISOString() };
  if (body.status && STATUSES.has(body.status)) updates.status = body.status;
  if (body.priority && PRIORITIES.has(body.priority)) updates.priority = body.priority;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to || null;
  if (body.status === "مغلقة") updates.closed_at = new Date().toISOString();

  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data, error } = await adminClient.from("contact_threads").update(updates).eq("id", threadId).select("*").single();
      if (!error && data) {
        await logEvent(adminClient, threadId, "thread_updated", updates, auth.userId);
        sendJson(res, 200, { ok: true, thread: data });
        return;
      }
    } catch {
      /* memory */
    }
  }

  const idx = mem.threads.findIndex((t) => t.id === threadId);
  if (idx >= 0) {
    mem.threads[idx] = { ...mem.threads[idx], ...updates };
    sendJson(res, 200, { ok: true, thread: mem.threads[idx] });
    return;
  }
  sendJson(res, 404, { ok: false, error: "not_found" });
}

async function deleteThread(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error });
    return;
  }
  const body = await parseBody(req);
  const threadId = body?.thread_id || body?.id;
  if (!threadId) {
    sendJson(res, 400, { ok: false, error: "id_required" });
    return;
  }

  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      await logEvent(adminClient, threadId, "thread_deleted", {}, auth.userId);
      await adminClient.from("contact_threads").delete().eq("id", threadId);
      sendJson(res, 200, { ok: true, deleted: threadId });
      return;
    } catch {
      /* memory */
    }
  }

  mem.threads = mem.threads.filter((t) => t.id !== threadId);
  mem.messages = mem.messages.filter((m) => m.thread_id !== threadId);
  mem.attachments = mem.attachments.filter((a) => a.thread_id !== threadId);
  mem.notes = mem.notes.filter((n) => n.thread_id !== threadId);
  sendJson(res, 200, { ok: true, deleted: threadId, source: "memory" });
}

async function addInternalNote(req, res) {
  const auth = await requireAdminAccess(req);
  if (!auth.ok) {
    sendJson(res, auth.status || 401, { ok: false, error: auth.error });
    return;
  }
  const body = await parseBody(req);
  const threadId = body?.thread_id;
  const noteBody = sanitizeText(body?.body, 2000);
  if (!threadId || !noteBody) {
    sendJson(res, 400, { ok: false, error: "invalid" });
    return;
  }

  const note = {
    id: newId(),
    thread_id: threadId,
    author_user_id: auth.userId,
    body: noteBody,
    created_at: new Date().toISOString(),
  };

  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      await adminClient.from("contact_internal_notes").insert(note);
      await logEvent(adminClient, threadId, "internal_note", {}, auth.userId);
      sendJson(res, 201, { ok: true, note });
      return;
    } catch {
      /* memory */
    }
  }
  mem.notes.unshift(note);
  sendJson(res, 201, { ok: true, note, source: "memory" });
}

async function unreadCounts(req, res) {
  const user = await getOptionalUser(req);
  const auth = await requireAdminAccess(req);
  const adminClient = getSupabaseAdmin();

  if (auth.ok && adminClient) {
    try {
      const { count } = await adminClient
        .from("contact_threads")
        .select("*", { count: "exact", head: true })
        .gt("unread_admin", 0)
        .not("status", "in", '("مغلقة","مؤرشفة")');
      sendJson(res, 200, { ok: true, admin_unread: count || 0 });
      return;
    } catch {
      /* fall through */
    }
  }

  if (user && adminClient) {
    try {
      const { count } = await adminClient
        .from("contact_threads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gt("unread_user", 0);
      sendJson(res, 200, { ok: true, user_unread: count || 0 });
      return;
    } catch {
      /* fall through */
    }
  }

  sendJson(res, 200, { ok: true, user_unread: 0, admin_unread: 0 });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const action = req.query?.action || (await parseBody(req))?.action || "threads";

  if (action === "create_thread" && req.method === "POST") {
    await createThread(req, res);
    return;
  }
  if (action === "threads") {
    await listThreads(req, res, { adminMode: req.query?.admin === "1" });
    return;
  }
  if (action === "admin_threads") {
    await listThreads(req, res, { adminMode: true });
    return;
  }
  if (action === "thread") {
    await getThread(req, res);
    return;
  }
  if (action === "messages") {
    await listMessages(req, res);
    return;
  }
  if (action === "send" && req.method === "POST") {
    await sendMessage(req, res, { adminReply: false });
    return;
  }
  if (action === "admin_reply" && req.method === "POST") {
    await sendMessage(req, res, { adminReply: true });
    return;
  }
  if (action === "user_update_thread" && req.method === "POST") {
    await userUpdateThread(req, res);
    return;
  }
  if (action === "update_thread" && req.method === "POST") {
    await updateThread(req, res);
    return;
  }
  if (action === "delete_thread" && req.method === "POST") {
    await deleteThread(req, res);
    return;
  }
  if (action === "internal_note" && req.method === "POST") {
    await addInternalNote(req, res);
    return;
  }
  if (action === "unread") {
    await unreadCounts(req, res);
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
