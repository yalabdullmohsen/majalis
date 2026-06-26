import { sendJson } from "../api/_http.mjs";

export default function handler(req, res) {
  sendJson(res, 200, { ok: true, service: "majlisilm-web" });
}
