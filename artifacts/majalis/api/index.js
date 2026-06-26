import { dispatchApiRequest } from "../lib/api-dispatch.mjs";

export default async function handler(req, res) {
  return dispatchApiRequest(req, res);
}
