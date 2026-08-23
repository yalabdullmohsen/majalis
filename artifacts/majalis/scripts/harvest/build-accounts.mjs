import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildAccountsRegistry } from "./accounts-seed.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../../public/data/sources");
mkdirSync(outDir, { recursive: true });
const accounts = buildAccountsRegistry();
writeFileSync(resolve(outDir, "accounts.json"), `${JSON.stringify({ version: 1, updated_at: new Date().toISOString(), accounts }, null, 2)}\n`, "utf8");
console.log(`accounts.json: ${accounts.length} حساب`);
