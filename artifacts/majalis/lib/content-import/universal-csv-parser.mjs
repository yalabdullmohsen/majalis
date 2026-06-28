/**
 * Universal CSV parser — auto delimiter + encoding detection.
 * Supports: comma, semicolon, tab, pipe | UTF-8, UTF-8 BOM, UTF-16 LE/BE
 */

import { splitCsvLine } from "./csv-parse.mjs";

export const SUPPORTED_DELIMITERS = [",", ";", "\t", "|"];

export const ENCODING_LABELS = {
  "utf-8": "UTF-8",
  "utf-8-bom": "UTF-8 BOM",
  "utf-16le": "UTF-16 LE",
  "utf-16be": "UTF-16 BE",
  "utf-8-fallback": "UTF-8 (fallback)",
};

/**
 * Detect encoding from raw buffer or string prefix.
 * @param {Buffer|string} input
 */
export function detectEncoding(input) {
  if (typeof input === "string") {
    if (input.charCodeAt(0) === 0xfeff) return { encoding: "utf-8-bom", label: ENCODING_LABELS["utf-8-bom"] };
    return { encoding: "utf-8", label: ENCODING_LABELS["utf-8"] };
  }

  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { encoding: "utf-8-bom", label: ENCODING_LABELS["utf-8-bom"] };
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return { encoding: "utf-16le", label: ENCODING_LABELS["utf-16le"] };
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return { encoding: "utf-16be", label: ENCODING_LABELS["utf-16be"] };
  }
  return { encoding: "utf-8", label: ENCODING_LABELS["utf-8"] };
}

/**
 * Decode buffer to string using detected encoding.
 * @param {Buffer|Uint8Array|string} input
 */
export function decodeContent(input) {
  if (typeof input === "string") {
    const enc = detectEncoding(input);
    const text = input.replace(/^\uFEFF/, "");
    return { text, encoding: enc.encoding, encodingLabel: enc.label };
  }

  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const enc = detectEncoding(buf);

  if (enc.encoding === "utf-8-bom") {
    return { text: buf.subarray(3).toString("utf8"), encoding: enc.encoding, encodingLabel: enc.label };
  }
  if (enc.encoding === "utf-16le") {
    return { text: buf.subarray(2).toString("utf16le"), encoding: enc.encoding, encodingLabel: enc.label };
  }
  if (enc.encoding === "utf-16be") {
    const swapped = Buffer.alloc(buf.length - 2);
    for (let i = 2; i + 1 < buf.length; i += 2) {
      swapped[i - 2] = buf[i + 1];
      swapped[i - 1] = buf[i];
    }
    return { text: swapped.toString("utf16le"), encoding: enc.encoding, encodingLabel: enc.label };
  }

  try {
    return { text: buf.toString("utf8"), encoding: "utf-8", encodingLabel: ENCODING_LABELS["utf-8"] };
  } catch {
    return { text: buf.toString("latin1"), encoding: "utf-8-fallback", encodingLabel: ENCODING_LABELS["utf-8-fallback"] };
  }
}

/**
 * Detect best delimiter from header line (comma, semicolon, tab, pipe).
 * @param {string} headerLine
 */
export function detectUniversalDelimiter(headerLine) {
  const counts = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch in counts) counts[ch]++;
  }

  let best = ",";
  let max = counts[","];
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) {
      max = c;
      best = d;
    }
  }
  return best;
}

/**
 * Parse CSV with auto delimiter + encoding.
 * @param {string|Buffer} content
 * @param {object} [opts]
 */
export function parseUniversalCsv(content, opts = {}) {
  const { text, encoding, encodingLabel } = decodeContent(content);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) {
    return { rows: [], headers: [], delimiter: ",", encoding, encodingLabel, rowCount: 0 };
  }

  const delimiter = opts.delimiter || detectUniversalDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) continue;
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return {
    rows,
    headers,
    delimiter,
    delimiterLabel: delimiter === "\t" ? "tab" : delimiter,
    encoding,
    encodingLabel,
    rowCount: rows.length,
  };
}

/**
 * Parse file content (CSV or JSON).
 * @param {string|Buffer} content
 * @param {string} filename
 */
export function parseUniversalFile(content, filename = "upload.csv") {
  const lower = String(filename).toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
    const parsed = parseUniversalCsv(content);
    return { format: "csv", ...parsed };
  }

  const { text } = decodeContent(content);
  const parsed = JSON.parse(text.trim());
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return {
    format: "json",
    rows,
    headers: rows[0] ? Object.keys(rows[0]) : [],
    delimiter: null,
    delimiterLabel: "json",
    encoding: "utf-8",
    encodingLabel: ENCODING_LABELS["utf-8"],
    rowCount: rows.length,
  };
}
