/**
 * /api/question-answer — compatibility alias for سؤال وجواب game API.
 * Delegates to sin-jeem handler; internal tables remain sin_jeem_*.
 */
import sinJeemHandler from "./sin-jeem.js";

export default async function handler(req, res) {
  return sinJeemHandler(req, res, { serviceName: "question-answer" });
}
