/**
 * Current-month sync window for backfill and incremental engines.
 */

export function currentMonthKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function currentMonthWindow(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return {
    monthKey: currentMonthKey(date),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function isInCurrentMonth(isoDate, date = new Date()) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const win = currentMonthWindow(date);
  const t = d.getTime();
  return t >= new Date(win.start).getTime() && t <= new Date(win.end).getTime();
}

export function isFutureOrCurrentMonth(isoDate, date = new Date()) {
  if (!isoDate) return true;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return d.getTime() >= monthStart.getTime();
}
