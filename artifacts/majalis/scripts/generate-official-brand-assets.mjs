#!/usr/bin/env node
/**
 * يولّد أصول العلامة الرسمية من public/brand/icon-1024.png
 * تشغيل: node scripts/generate-official-brand-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync, copyFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = resolve(root, "public");
const brand = resolve(pub, "brand");
const srcPath = resolve(brand, "icon-1024.png");
const srcBuf = await sharp(srcPath).png().toBuffer();
const GREEN = { r: 0, g: 43, b: 33, alpha: 1 };

copyFileSync(srcPath, resolve(brand, "official.png"));

async function square(size, out) {
  await sharp(srcBuf).resize(size, size, { fit: "cover" }).png().toFile(out);
}

await square(512, resolve(pub, "icon-512.png"));
await square(512, resolve(pub, "logo.png"));
await square(512, resolve(pub, "favicon.png"));
await square(192, resolve(pub, "icon-192.png"));
await square(180, resolve(pub, "apple-touch-icon.png"));
await square(96, resolve(pub, "icon-96.png"));
await square(48, resolve(pub, "favicon-48.png"));
await square(32, resolve(pub, "favicon-32.png"));
await square(512, resolve(brand, "icon-512-maskable.png"));
await sharp(srcBuf).png().toFile(resolve(brand, "icon-1024-maskable.png"));

const logo = await sharp(srcBuf)
  .resize(520, 520, { fit: "contain", background: GREEN })
  .png()
  .toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: GREEN } })
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(resolve(brand, "official-og.png"));

const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) pngs.push(await sharp(srcBuf).resize(s, s).png().toBuffer());

function pngsToIco(buffers, dims) {
  const count = buffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let off = 6 + count * 16;
  const metas = [];
  for (let i = 0; i < count; i++) {
    const s = dims[i];
    const meta = Buffer.alloc(16);
    meta[0] = s >= 256 ? 0 : s;
    meta[1] = s >= 256 ? 0 : s;
    meta.writeUInt16LE(0, 2);
    meta.writeUInt16LE(1, 4);
    meta.writeUInt16LE(32, 6);
    meta.writeUInt32LE(buffers[i].length, 8);
    meta.writeUInt32LE(off, 12);
    metas.push(meta);
    off += buffers[i].length;
  }
  return Buffer.concat([header, ...metas, ...buffers]);
}
writeFileSync(resolve(pub, "favicon.ico"), pngsToIco(pngs, sizes));

console.log("✓ official brand assets from", srcPath);
