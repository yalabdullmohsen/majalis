import { sendJson } from "./_http.js";

export default function handler(req, res) {
  sendJson(res, 200, { ok: true, service: "majlisilm-web" });
}
