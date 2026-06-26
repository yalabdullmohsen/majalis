import { sendJson } from "./_http.js";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import {
  getAllPaths,
  getPathWithModules,
  enrollInPath,
  updateModuleProgress,
  getUserProgress,
  getUserStats,
  suggestNextModule,
  getQuiz,
  submitQuizAttempt,
  issueCertificate,
  verifyCertificate,
  getUserCertificates,
  getCalendarEvents,
  subscribeToEvent,
  saveToLibrary,
  getLibrary,
  saveNote,
  getNotes,
  generateLessonInsights,
} from "../lib/digital-learning/index.mjs";

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "paths";
  const admin = getSupabaseAdmin();
  const userId = req.query?.userId || req.body?.userId || null;

  try {
    if (action === "paths") {
      const paths = await getAllPaths(admin);
      sendJson(res, 200, { ok: true, paths });
      return;
    }

    if (action === "path") {
      const slug = req.query?.slug || req.body?.slug;
      const data = await getPathWithModules(admin, slug);
      if (!data) {
        sendJson(res, 404, { ok: false, error: "path_not_found" });
        return;
      }
      const progress = await getUserProgress(admin, userId);
      const next = suggestNextModule(slug, progress);
      sendJson(res, 200, { ok: true, ...data, next_module: next });
      return;
    }

    if (action === "enroll") {
      const { slug, pathId } = req.body || req.query || {};
      const result = await enrollInPath(admin, userId, slug, pathId);
      sendJson(res, 200, result);
      return;
    }

    if (action === "progress") {
      if (req.method === "POST") {
        const result = await updateModuleProgress(admin, userId, req.body);
        sendJson(res, 200, result);
        return;
      }
      const data = await getUserProgress(admin, userId);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (action === "stats") {
      const stats = await getUserStats(admin, userId);
      sendJson(res, 200, { ok: true, stats });
      return;
    }

    if (action === "quiz") {
      const quizId = req.query?.quizId || req.body?.quizId || req.query?.slug;
      if (req.method === "POST") {
        const result = await submitQuizAttempt(admin, userId, quizId, req.body.answers || {});
        sendJson(res, 200, result);
        return;
      }
      const quiz = await getQuiz(admin, quizId);
      sendJson(res, 200, { ok: true, quiz });
      return;
    }

    if (action === "certificate") {
      if (req.query?.verify || req.body?.verify) {
        const result = await verifyCertificate(admin, req.query?.code || req.body?.code);
        sendJson(res, 200, result);
        return;
      }
      if (req.method === "POST") {
        const result = await issueCertificate(admin, userId, req.body);
        sendJson(res, 200, result);
        return;
      }
      const certs = await getUserCertificates(admin, userId);
      sendJson(res, 200, { ok: true, certificates: certs });
      return;
    }

    if (action === "calendar") {
      if (req.method === "POST") {
        const result = await subscribeToEvent(admin, userId, req.body.eventId);
        sendJson(res, 200, result);
        return;
      }
      const events = await getCalendarEvents(admin, req.query);
      sendJson(res, 200, { ok: true, events });
      return;
    }

    if (action === "library") {
      if (req.method === "POST") {
        const result = await saveToLibrary(admin, userId, req.body);
        sendJson(res, 200, result);
        return;
      }
      const items = await getLibrary(admin, userId, req.query?.type);
      sendJson(res, 200, { ok: true, items });
      return;
    }

    if (action === "notes") {
      if (req.method === "POST") {
        const result = await saveNote(admin, userId, req.body);
        sendJson(res, 200, result);
        return;
      }
      const notes = await getNotes(admin, userId);
      sendJson(res, 200, { ok: true, notes });
      return;
    }

    if (action === "ai-insights") {
      const result = await generateLessonInsights(admin, { ...req.body, userId });
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
