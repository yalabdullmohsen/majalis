export function sendJson(res, status, payload) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(payload);
    return;
  }

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function endEmpty(res, status = 204) {
  if (typeof res.status === "function" && typeof res.end === "function") {
    res.status(status).end();
    return;
  }

  res.statusCode = status;
  res.end();
}
