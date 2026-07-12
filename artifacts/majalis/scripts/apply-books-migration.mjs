import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(__dir, "../../../supabase/books_tables.sql");
const sql = readFileSync(sqlFile, "utf8");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect().catch(e => { console.error("connect error:", e); process.exit(1); });
console.log("✓ متصل");

const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

let ok = 0, skip = 0;
for (const stmt of statements) {
  try {
    await client.query(stmt + ";");
    ok++;
  } catch (e) {
    if (e.code === "42P07" || e.message.includes("already exists") || e.code === "23505") {
      skip++;
    } else {
      console.error("Error in statement:", stmt.slice(0, 80));
      console.error("Details:", e.message, "code:", e.code);
    }
  }
}

console.log(`✓ ${ok} statements نجحت، ${skip} موجودة مسبقاً`);

const { rows } = await client.query("SELECT COUNT(*) AS cnt FROM books WHERE is_approved = false");
console.log(`✓ كتب بانتظار المراجعة: ${rows[0].cnt}`);

await client.end();
