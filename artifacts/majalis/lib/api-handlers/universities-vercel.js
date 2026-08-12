/**
 * universities-vercel.js — Router wrapper لـ Vercel serverless
 *
 * يُترجم URL+Method → action ثم يستدعي universitiesHandler.
 * ضروري لأن api-dispatch.mjs لا يعرف بـ Express params.
 */
import universitiesHandler from "./universities.js";
import { sendJson } from "../api/_http.mjs";

export const maxDuration = 30;

export default async function handler(req, res) {
  const method = req.method?.toUpperCase() || "GET";
  const url    = req.url || "";
  const path   = url.split("?")[0];

  if (!req.params) req.params = {};

  // ── مسارات عامة ──────────────────────────────────────────────────────────

  // GET /api/universities
  if ((path === "/api/universities" || path === "/api/universities/") && method === "GET") {
    return universitiesHandler(req, res, "list");
  }

  // GET|POST /api/universities/compare
  if (path === "/api/universities/compare") {
    return universitiesHandler(req, res, "compare");
  }

  // GET /api/universities/:slug
  const slugM = path.match(/^\/api\/universities\/([^/]+)$/);
  if (slugM && method === "GET") {
    req.params.slug = decodeURIComponent(slugM[1]);
    return universitiesHandler(req, res, "detail");
  }

  // ── مسارات Admin ─────────────────────────────────────────────────────────

  // GET /api/admin/reminders
  if (path === "/api/admin/reminders" && method === "GET") {
    return universitiesHandler(req, res, "admin-reminders");
  }

  // PUT /api/admin/reminders/:id
  const reminderM = path.match(/^\/api\/admin\/reminders\/([^/]+)$/);
  if (reminderM && method === "PUT") {
    req.params.id = reminderM[1];
    return universitiesHandler(req, res, "admin-reminder-update");
  }

  // GET /api/admin/universities
  if ((path === "/api/admin/universities" || path === "/api/admin/universities/") && method === "GET") {
    return universitiesHandler(req, res, "admin-list");
  }

  // POST /api/admin/universities
  if ((path === "/api/admin/universities" || path === "/api/admin/universities/") && method === "POST") {
    return universitiesHandler(req, res, "admin-create");
  }

  // PUT /api/admin/universities/:id
  const adminUpdM = path.match(/^\/api\/admin\/universities\/([^/]+)$/);
  if (adminUpdM && method === "PUT") {
    req.params.id = adminUpdM[1];
    return universitiesHandler(req, res, "admin-update");
  }

  // POST /api/admin/universities/:universityId/programs
  const progAddM = path.match(/^\/api\/admin\/universities\/([^/]+)\/programs$/);
  if (progAddM && method === "POST") {
    req.params.universityId = progAddM[1];
    return universitiesHandler(req, res, "admin-program-add");
  }

  // PUT /api/admin/programs/:id
  const progM = path.match(/^\/api\/admin\/programs\/([^/]+)$/);
  if (progM && method === "PUT") {
    req.params.id = progM[1];
    return universitiesHandler(req, res, "admin-program-update");
  }

  // DELETE /api/admin/programs/:id
  if (progM && method === "DELETE") {
    req.params.id = progM[1];
    return universitiesHandler(req, res, "admin-program-delete");
  }

  // POST /api/admin/requirements/:programId
  const reqsM = path.match(/^\/api\/admin\/requirements\/([^/]+)$/);
  if (reqsM && method === "POST") {
    req.params.programId = reqsM[1];
    return universitiesHandler(req, res, "admin-requirements");
  }

  // POST|DELETE /api/admin/faqs/:id
  const faqM = path.match(/^\/api\/admin\/faqs\/([^/]+)$/);
  if (faqM && method === "POST") {
    req.params.universityId = faqM[1];
    return universitiesHandler(req, res, "admin-faq-add");
  }
  if (faqM && method === "DELETE") {
    req.params.id = faqM[1];
    return universitiesHandler(req, res, "admin-faq-delete");
  }

  sendJson(res, 404, { ok: false, error: "المسار غير موجود" });
}
