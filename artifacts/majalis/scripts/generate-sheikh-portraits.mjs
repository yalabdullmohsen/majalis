import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/sheikhs");

const PORTRAITS = [
  { file: "salem-altaweel.svg", label: "سالم الطويل", initial: "س" },
  { file: "hussein-muwaiziri.svg", label: "حسين المويزري", initial: "ح" },
  { file: "daham-abukhashba.svg", label: "دهام أبو خشبة", initial: "د" },
  { file: "nasar-alajmi.svg", label: "نصار العجمي", initial: "ن" },
  { file: "hamed-almesaad.svg", label: "حامد المسعد", initial: "ح" },
  { file: "faisal-zowaid.svg", label: "فيصل زويد", initial: "ف" },
  { file: "saad-otaibi.svg", label: "سعد العتيبي", initial: "س" },
  { file: "bandar-almaimouni.svg", label: "بندر الميموني", initial: "ب" },
  { file: "mutlaq-aljasser.svg", label: "مطلق الجاسر", initial: "م" },
];

function svg({ label, initial }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F0E8D6"/>
      <stop offset="100%" stop-color="#FAF5EA"/>
    </linearGradient>
  </defs>
  <rect width="320" height="400" rx="24" fill="url(#bg)" stroke="#E0D7C4" stroke-width="3"/>
  <circle cx="160" cy="130" r="72" fill="#164E3C"/>
  <text x="160" y="148" text-anchor="middle" fill="#FAF5EA" font-family="Cairo, sans-serif" font-size="52" font-weight="700">${initial}</text>
  <rect x="88" y="210" width="144" height="120" rx="36" fill="#1F6E54"/>
  <text x="160" y="360" text-anchor="middle" fill="#5B5446" font-family="Cairo, sans-serif" font-size="17">${label}</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });
for (const item of PORTRAITS) {
  await writeFile(resolve(outDir, item.file), svg(item), "utf8");
}
console.log(`Generated ${PORTRAITS.length} sheikh portrait SVGs in public/sheikhs/`);
