import { sendJson } from "./_http.js";

export default function handler(req, res) {
  console.log("[healthz] request", req.method);
  sendJson(res, 200, { ok: true, service: "majalis-web" });
}
