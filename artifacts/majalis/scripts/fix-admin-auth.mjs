import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "src/lib/open-platform-service.ts",
  "src/lib/islamic-intelligence-service.ts",
  "src/lib/scholarly-verification-service.ts",
  "src/lib/scholarly-intelligence-service.ts",
  "src/lib/global-reference-service.ts",
  "src/lib/digital-learning-service.ts",
  "src/lib/knowledge-engine-service.ts",
  "src/lib/auto-content-service.ts",
];

function fixFile(file) {
  let c = readFileSync(file, "utf8");

  if (!c.includes("@/lib/admin-api")) {
    const m = c.match(/^(\/\*\*[\s\S]*?\*\/\n)/);
    if (m) {
      c = m[1] + '\nimport { adminFetch as apiFetch } from "@/lib/admin-api";\n' + c.slice(m[1].length);
    } else {
      c = 'import { adminFetch as apiFetch } from "@/lib/admin-api";\n' + c;
    }
  }

  c = c.replace(/function authHeaders\(\): Record<string, string> \{[\s\S]*?\n\}\n\n?/g, "");

  c = c.replace(
    /await fetch\((`[^`]+`|"[^"]+"),\s*\{\s*method:\s*"POST",\s*headers:\s*authHeaders\(\),\s*body:\s*JSON\.stringify\(([^)]+)\),\s*\}\)/g,
    'await apiFetch($1, { method: "POST", body: JSON.stringify($2) })',
  );
  c = c.replace(
    /await fetch\((`[^`]+`|"[^"]+"),\s*\{\s*method:\s*"POST",\s*headers:\s*authHeaders\(\)\s*\}\)/g,
    'await apiFetch($1, { method: "POST" })',
  );
  c = c.replace(
    /await fetch\((`[^`]+`|"[^"]+"),\s*\{\s*headers:\s*authHeaders\(\)\s*\}\)/g,
    "await apiFetch($1)",
  );
  c = c.replace(
    /const secret = import\.meta\.env\.VITE_CRON_SECRET \|\| "";\s*const res = await fetch\(([^,]+),\s*\{\s*method:\s*"POST",\s*headers:\s*secret \? \{ Authorization: `Bearer \$\{secret\}` \} : \{\},\s*\}\);/g,
    'const res = await apiFetch($1, { method: "POST" });',
  );
  c = c.replace(
    /const secret = import\.meta\.env\.VITE_CRON_SECRET \|\| "";\s*const res = await fetch\(([^,]+),\s*\{\s*headers:\s*secret \? \{ Authorization: `Bearer \$\{secret\}` \} : \{\},\s*\}\);/g,
    "const res = await apiFetch($1);",
  );
  c = c.replace(
    /const secret = import\.meta\.env\.VITE_ADMIN_API_SECRET \|\| import\.meta\.env\.VITE_CRON_SECRET;[\s\S]*?throw new Error\("Unauthorized"\);\s*/g,
    "",
  );
  c = c.replace(
    /const secret = import\.meta\.env\.VITE_ADMIN_API_SECRET \|\| import\.meta\.env\.VITE_CRON_SECRET;\s*const res = await fetch\(([^,]+),\s*\{\s*headers:\s*secret \? \{ Authorization: `Bearer \$\{secret\}` \} : \{\},\s*\}\);/g,
    "const res = await apiFetch($1);",
  );

  // Fix local wrappers that used fetch internally
  c = c.replace(
    /async function (\w+)\(action: string, body\?: Record<string, unknown>\) \{\s*const res = await fetch\(`([^`]+)\$\{action\}`[^)]+\);/g,
    (match, fn, prefix) =>
      `async function ${fn}(action: string, body?: Record<string, unknown>) {\n  const res = await apiFetch(\`${prefix}\${action}\`, {\n    method: body ? "POST" : "GET",\n    body: body ? JSON.stringify(body) : undefined,\n  });`,
  );

  writeFileSync(file, c);
  console.log("fixed", file);
}

for (const f of files) fixFile(f);
