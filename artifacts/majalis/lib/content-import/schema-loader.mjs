/**
 * Load JSON schemas for Universal Import Engine.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TYPE_REGISTRY } from "./registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = join(__dirname, "schemas");

/** @type {Map<string, object>} */
const cache = new Map();

function loadSchemaFile(type) {
  if (cache.has(type)) return cache.get(type);
  try {
    const raw = readFileSync(join(SCHEMA_DIR, `${type}.schema.json`), "utf8");
    const schema = JSON.parse(raw);
    cache.set(type, schema);
    return schema;
  } catch {
    return null;
  }
}

/** @typedef {{ type: string, label: string, table?: string, fields: Record<string, { required?: boolean, type?: string, label?: string }>, oneOf?: string[][], optionalFields?: string[] }} ContentSchema */

/**
 * @param {string} type
 * @returns {ContentSchema|null}
 */
export function getContentSchema(type) {
  const key = String(type || "").trim().toLowerCase();
  const fromFile = loadSchemaFile(key);
  if (fromFile) return fromFile;

  const def = TYPE_REGISTRY[key];
  if (!def) return null;

  return {
    type: def.type,
    label: def.label,
    table: def.table,
    fields: {},
    optionalFields: [],
  };
}

export function listContentSchemas() {
  try {
    return readdirSync(SCHEMA_DIR)
      .filter((f) => f.endsWith(".schema.json"))
      .map((f) => f.replace(".schema.json", ""));
  } catch {
    return Object.keys(TYPE_REGISTRY);
  }
}

export function schemaToLegacyFormat(schema) {
  if (!schema?.fields) return null;
  const required = Object.entries(schema.fields)
    .filter(([, def]) => def.required)
    .map(([name]) => name);
  return {
    label: schema.label,
    required,
    oneOf: schema.oneOf || [],
  };
}
