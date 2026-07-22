#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(appRoot, "seo-prerender");
const distRoot = resolve(appRoot, "dist");
const shell = await readFile(resolve(distRoot, "index.html"), "utf8");

const assetTags = [...shell.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="[^"]*\/assets\/[^"]+"[^>]*>(?:<\/script>)?/g)]
  .map((match) => match[0])
  .join("\n    ");

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name === "index.html") files.push(path);
  }
  return files;
}

const files = await htmlFiles(sourceRoot);
for (const source of files) {
  const generated = await readFile(source, "utf8");
  const head = generated.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const body = generated.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  const output = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>${head}\n    ${assetTags}\n  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>\n`;
  const destination = resolve(distRoot, relative(sourceRoot, source));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, output, "utf8");
}

console.log(`[prerender] published ${files.length} route documents into dist`);
