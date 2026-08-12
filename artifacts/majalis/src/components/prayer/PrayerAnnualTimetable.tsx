import { useMemo, useState } from "react";
import { CalendarRange, Download } from "lucide-react";
import {
  downloadBlob,
  exportTimetableCsv,
  generateMonthTimetable,
  generateYearTimetable,
  type AnnualDayRow,
} from "@/lib/prayer-annual";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { toArabicIndicDigits } from "@/lib/numerals";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function PrayerAnnualTimetable() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<"month" | "year">("month");
  const [rows, setRows] = useState<AnnualDayRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loc = useMemo(() => getActivePrayerLocation(), [rows.length, busy]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const data =
        mode === "month"
          ? await generateMonthTimetable(year, month)
          : await generateYearTimetable(year);
      setRows(data);
    } catch {
      setError("تعذّر توليد الإمساكية محلياً.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!rows.length) return;
    const title =
      mode === "month"
        ? `إمساكية ${MONTHS_AR[month - 1]} ${year} — ${loc.label}`
        : `إمساكية سنة ${year} — ${loc.label}`;
    const blob = exportTimetableCsv(rows, title);
    downloadBlob(blob, `prayer-${year}-${mode === "month" ? month : "full"}.csv`);
  }

  return (
    <section className="pts-annual" aria-label="إمساكية السنة">
      <header className="pts-annual__head">
        <CalendarRange size={16} aria-hidden />
        <h2>إمساكية أوفلاين — السنة كاملة</h2>
      </header>
      <p className="pts-annual__hint">
        تُحسب محلياً بدون إنترنت لموقع: <strong>{loc.label}</strong>
      </p>

      <div className="pts-annual__controls">
        <label>
          <span>السنة</span>
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
          />
        </label>
        <label>
          <span>النطاق</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as "month" | "year")}>
            <option value="month">شهر</option>
            <option value="year">سنة كاملة</option>
          </select>
        </label>
        {mode === "month" && (
          <label>
            <span>الشهر</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS_AR.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="pts-annual__gen" onClick={() => void generate()} disabled={busy}>
          {busy ? "جاري الحساب…" : "توليد الجدول"}
        </button>
        <button
          type="button"
          className="pts-annual__export"
          onClick={exportCsv}
          disabled={!rows.length}
        >
          <Download size={14} aria-hidden />
          تصدير CSV
        </button>
      </div>

      {error && <p className="pts-loc__err" role="alert">{error}</p>}

      {rows.length > 0 && (
        <div className="pts-annual__table-wrap">
          <table className="pts-annual__table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الفجر</th>
                <th>الشروق</th>
                <th>الظهر</th>
                <th>العصر</th>
                <th>المغرب</th>
                <th>العشاء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dateKey}>
                  <td>{toArabicIndicDigits(r.dateKey)}</td>
                  <td>{toArabicIndicDigits(r.fajr)}</td>
                  <td>{toArabicIndicDigits(r.sunrise)}</td>
                  <td>{toArabicIndicDigits(r.dhuhr)}</td>
                  <td>{toArabicIndicDigits(r.asr)}</td>
                  <td>{toArabicIndicDigits(r.maghrib)}</td>
                  <td>{toArabicIndicDigits(r.isha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
