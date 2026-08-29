/**
 * مصدر موحّد لقراءة شجرة التوجيه بعد تقسيم AppRoutes.
 * الاختبارات التي تبحث عن مسارات/صفحات تقرأ الاثنين معًا.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function readAppRoutingSource(): string {
  const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
  const routes = readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
  return `${app}\n${routes}`;
}
