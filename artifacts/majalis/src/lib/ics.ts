/**
 * توليد ملف ICS وتنزيله لإضافة الدرس للتقويم.
 */

function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadICS(lesson: {
  title: string;
  date: Date;
  location?: string;
  description?: string;
}): void {
  const uid = `majalis-${Date.now()}@majlisilm.com`;
  const now  = formatICSDate(new Date());
  const start = formatICSDate(lesson.date);
  // مدة افتراضية ساعة واحدة
  const end = formatICSDate(new Date(lesson.date.getTime() + 60 * 60 * 1000));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//مجالس العلمية//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(lesson.title)}`,
    lesson.location ? `LOCATION:${escapeICS(lesson.location)}` : "",
    lesson.description ? `DESCRIPTION:${escapeICS(lesson.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${lesson.title.replace(/[^a-zA-Z؀-ۿ\s]/g, "").trim() || "lesson"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
