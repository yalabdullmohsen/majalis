/**
 * Lesson import/publish field policy — required vs important vs optional.
 * Non-blocking: missing optional/important fields must not fail the whole CSV.
 */

function pick(data, ...keys) {
  for (const k of keys) {
    const v = data?.[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function hasAnyContent(row) {
  return Object.entries(row || {}).some(([k, v]) => {
    if (k.startsWith("_")) return false;
    return v != null && String(v).trim().length > 0;
  });
}

const DAY_NAMES =
  /(?:السبت|الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|سبت|أحد|احد|اثنين|إثنين|ثلاثاء|أربعاء|خميس|جمعة)/i;

const TIME_PATTERN = /\d{1,2}\s*[:：]\s*\d{2}|\d{1,2}\s*(?:ص|م|am|pm)/i;

export function hasResolvableTitle(row) {
  return Boolean(pick(row, "title", "generated_title"));
}

export function hasResolvableDate(row) {
  if (pick(row, "date", "start_date", "gregorian_date", "lesson_date")) return true;
  if (pick(row, "day_of_week", "day") && DAY_NAMES.test(pick(row, "day_of_week", "day"))) return true;
  const schedule = pick(row, "schedule");
  if (schedule && DAY_NAMES.test(schedule)) return true;
  if (schedule && /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/.test(schedule)) return true;
  return false;
}

export function hasResolvableTime(row) {
  if (pick(row, "lesson_time", "time")) return true;
  const schedule = pick(row, "schedule");
  return Boolean(schedule && TIME_PATTERN.test(schedule));
}

export function hasResolvableSource(row) {
  return Boolean(
    pick(row, "source_url", "website_url", "site_url", "source", "permalink", "url", "registration_url"),
  );
}

export function generateLessonTitle(row) {
  const sheikh = pick(row, "speaker_name", "sheikh_name");
  const mosque = pick(row, "mosque", "location");
  const activity = pick(row, "activity_type") || "درس";
  const day = pick(row, "day_of_week", "day");
  const date = pick(row, "date", "start_date", "gregorian_date");
  const time = pick(row, "lesson_time", "time");

  const parts = [];
  if (sheikh) parts.push(`للشيخ ${sheikh}`);
  if (mosque) parts.push(`في ${mosque}`);
  else if (pick(row, "city", "governorate")) parts.push(`في ${pick(row, "city", "governorate")}`);

  let title = activity;
  if (parts.length) title = `${activity} ${parts.join(" ")}`;
  if (date) title += ` — ${date}`;
  else if (day) title += ` — ${day}`;
  if (time) title += ` ${time}`;

  return title.trim().slice(0, 200) || `درس مستورد — ${new Date().toISOString().slice(0, 10)}`;
}

/** Normalize aliases and infer missing non-critical fields. */
export function normalizeLessonRow(row, ctx = {}) {
  const out = { ...row };

  if (!pick(out, "title")) out.title = pick(out, "generated_title");
  if (!pick(out, "speaker_name")) out.speaker_name = pick(out, "sheikh_name");
  if (!pick(out, "sheikh_name")) out.sheikh_name = pick(out, "speaker_name");
  if (!pick(out, "mosque")) out.mosque = pick(out, "location", "masjid");
  if (!pick(out, "location")) out.location = pick(out, "mosque");
  if (!pick(out, "city")) out.city = pick(out, "governorate", "محافظة") || null;
  if (!pick(out, "governorate")) out.governorate = pick(out, "city") || null;
  if (!pick(out, "day_of_week")) out.day_of_week = pick(out, "day");
  if (!pick(out, "lesson_time")) out.lesson_time = pick(out, "time");
  if (!pick(out, "description")) {
    out.description = pick(out, "notes", "summary", "raw_text", "caption") || null;
  }
  if (!pick(out, "category")) out.category = "أخرى";

  if (!hasResolvableSource(out)) {
    out.source_url = ctx.defaultSourceUrl || pick(out, "source_url") || "csv://majalis-import";
    out._source_inferred = true;
  } else if (!pick(out, "source_url")) {
    out.source_url =
      pick(out, "website_url", "site_url", "source", "permalink", "url", "registration_url") || null;
  }

  if (!hasResolvableTitle(out)) {
    out.title = generateLessonTitle(out);
    out._title_generated = true;
  }

  if (!hasResolvableDate(out) && !pick(out, "day_of_week")) {
    out.day_of_week = "—";
    out._date_inferred = true;
  }

  if (!hasResolvableTime(out) && !pick(out, "lesson_time")) {
    out.lesson_time = "—";
    out._time_inferred = true;
  }

  return out;
}

export function assessLessonRow(row, index, ctx = {}) {
  const line = index + 1;

  if (!hasAnyContent(row)) {
    return {
      ok: false,
      row,
      line,
      disposition: "skipped",
      missingRequired: ["empty_row"],
      missingImportant: [],
      missingOptional: [],
      errors: [`السطر ${line}: صف فارغ — تم تخطيه`],
      review: false,
      incomplete: false,
    };
  }

  const normalized = normalizeLessonRow(row, ctx);

  const missingRequired = [];
  const missingImportant = [];
  const missingOptional = [];

  if (!hasResolvableTitle(normalized) && !normalized._title_generated) missingRequired.push("title");
  if (!hasResolvableDate(normalized) && !normalized._date_inferred) missingRequired.push("date");
  if (!hasResolvableTime(normalized) && !normalized._time_inferred) missingRequired.push("time");
  if (!hasResolvableSource(normalized) && !normalized._source_inferred) missingRequired.push("source");

  if (!pick(normalized, "speaker_name", "sheikh_name")) missingImportant.push("sheikh");
  if (!pick(normalized, "mosque", "location")) missingImportant.push("mosque");
  if (!pick(normalized, "region")) missingImportant.push("region");
  if (!pick(normalized, "city", "governorate")) missingImportant.push("governorate");
  if (!pick(normalized, "category") || normalized.category === "أخرى") missingImportant.push("category");

  for (const field of ["live_url", "stream_url", "maps_url", "contact_phone", "phone", "notes", "women_section", "organizer"]) {
    if (!pick(normalized, field)) missingOptional.push(field);
  }

  const critical = missingRequired.length > 0;
  let disposition = "published";
  if (critical) disposition = "review_queued";
  else if (missingImportant.length > 0 || normalized._title_generated || normalized._date_inferred || normalized._time_inferred) {
    disposition = "published_incomplete";
  }

  const errors = critical
    ? missingRequired.map((f) => `السطر ${line}: بيانات حرجة ناقصة — ${f}`)
    : [];

  return {
    ok: !critical,
    row: normalized,
    line,
    disposition,
    missingRequired,
    missingImportant,
    missingOptional,
    errors,
    review: critical,
    incomplete: !critical && (missingImportant.length > 0 || Boolean(normalized._title_generated)),
  };
}

export function validateLessonRowsResilient(rows, ctx = {}) {
  const validRows = [];
  const validationErrors = [];
  const rowReports = [];
  const stats = {
    published: 0,
    review_queued: 0,
    published_incomplete: 0,
    failed: 0,
    missing_optional_fields: 0,
    missing_required_fields: 0,
  };

  for (let index = 0; index < rows.length; index++) {
    const assessment = assessLessonRow(rows[index], index, ctx);
    rowReports.push(assessment);

    if (assessment.missingRequired.length) stats.missing_required_fields += assessment.missingRequired.length;
    if (assessment.missingImportant.length || assessment.missingOptional.length) {
      stats.missing_optional_fields += assessment.missingImportant.length + assessment.missingOptional.length;
    }

    if (!assessment.ok) {
      if (assessment.disposition === "skipped") {
        stats.failed += 1;
        for (const err of assessment.errors) {
          if (validationErrors.length < 200) validationErrors.push(err);
        }
        continue;
      }
      stats.failed += 1;
      stats.review_queued += 1;
      for (const err of assessment.errors) {
        if (validationErrors.length < 200) validationErrors.push(err);
      }
      validRows.push({
        ...assessment.row,
        status: "pending_review",
        _import_disposition: "review_queued",
        _missing_fields: [...assessment.missingRequired, ...assessment.missingImportant],
      });
      continue;
    }

    const payload = {
      ...assessment.row,
      status: assessment.disposition === "published_incomplete" ? "approved" : "approved",
      _import_disposition: assessment.disposition,
      _missing_fields: assessment.missingImportant,
      _data_incomplete: assessment.incomplete,
    };

    if (assessment.disposition === "published_incomplete") {
      stats.published_incomplete += 1;
      const kw = Array.isArray(payload.keywords) ? payload.keywords : [];
      if (!kw.includes("بيانات_ناقصة")) payload.keywords = [...kw, "بيانات_ناقصة"];
    } else {
      stats.published += 1;
    }

    validRows.push(payload);
  }

  return {
    validRows,
    validationErrors,
    allValid: validRows.length > 0,
    partial: validationErrors.length > 0,
    rowReports,
    stats,
  };
}
