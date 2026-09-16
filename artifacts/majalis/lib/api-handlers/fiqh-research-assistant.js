import { sendJson } from "../api/_http.mjs";

/** المجمع الفقهي أُلغي كمنتج — المساعد البحثي المرتبط به متوقف. */
export const maxDuration = 10;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  sendJson(res, 410, {
    ok: false,
    available: false,
    message: "أُزيل مساعد البحث المرتبط بالمجمع الفقهي. استخدم قسم الفقه العام.",
  });
}
