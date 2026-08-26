/**
 * مشّاء كوربوسات المحتوى — يمرّ على كل ملف وكل حرف وفق جذور مشتركة.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, resolve } from "node:path";
import {
  CONTENT_CORPORA_EXTENSIONS,
  CONTENT_CORPORA_ROOTS,
  CONTENT_CORPORA_SKIP_PARTS,
  MAX_CORPUS_FILE_BYTES,
} from "./corpora-roots";

export type CorpusFile = {
  abs: string;
  rel: string;
  text: string;
};

function shouldSkip(relParts: string[]): boolean {
  return relParts.some((p) => {
    if (CONTENT_CORPORA_SKIP_PARTS.has(p)) return true;
    if (p.startsWith("deleted-")) return true;
    return false;
  });
}

export function walkCorpusFiles(appRoot: string): CorpusFile[] {
  const out: CorpusFile[] = [];
  for (const rootRel of CONTENT_CORPORA_ROOTS) {
    const rootAbs = resolve(appRoot, rootRel);
    if (!existsSync(rootAbs)) continue;
    const stack = [rootAbs];
    while (stack.length) {
      const cur = stack.pop()!;
      let entries;
      try {
        entries = readdirSync(cur, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const abs = join(cur, ent.name);
        const rel = relative(appRoot, abs).replace(/\\/g, "/");
        const parts = rel.split("/");
        if (shouldSkip(parts)) continue;
        if (ent.isDirectory()) {
          stack.push(abs);
          continue;
        }
        if (!CONTENT_CORPORA_EXTENSIONS.has(extname(ent.name))) continue;
        let st;
        try {
          st = statSync(abs);
        } catch {
          continue;
        }
        if (st.size > MAX_CORPUS_FILE_BYTES) continue;
        let text: string;
        try {
          text = readFileSync(abs, "utf8");
        } catch {
          continue;
        }
        out.push({ abs, rel, text });
      }
    }
  }
  return out;
}

/** يمرّ على كل حرف في النص مع فهرس UTF-16. */
export function forEachChar(
  text: string,
  fn: (ch: string, index: number) => void,
): void {
  for (let i = 0; i < text.length; i += 1) {
    fn(text[i]!, i);
  }
}

export function countChar(text: string, target: string): number {
  let n = 0;
  forEachChar(text, (ch) => {
    if (ch === target) n += 1;
  });
  return n;
}

export function findCharIssues(text: string): {
  pua: number;
  replacement: number;
  control: number;
  samples: string[];
} {
  let pua = 0;
  let replacement = 0;
  let control = 0;
  const samples: string[] = [];
  forEachChar(text, (ch, i) => {
    const code = ch.charCodeAt(0);
    const isPua =
      (code >= 0xe000 && code <= 0xf8ff) ||
      (code >= 0xfde0 && code <= 0xfdef);
    const isRepl = ch === "\uFFFD";
    const isCtrl =
      (code >= 0 && code <= 8) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f;
    if (isPua) {
      pua += 1;
      if (samples.length < 5) samples.push(`PUA@${i}:U+${code.toString(16)}`);
    }
    if (isRepl) {
      replacement += 1;
      if (samples.length < 8) {
        samples.push(`FFFD@${i}:${JSON.stringify(text.slice(Math.max(0, i - 12), i + 12))}`);
      }
    }
    if (isCtrl) {
      control += 1;
      if (samples.length < 8) samples.push(`CTRL@${i}:U+${code.toString(16)}`);
    }
  });
  return { pua, replacement, control, samples };
}

const MOJIBAKE = [
  // تُبنى مجزّأة حتى لا يطابق ملف البوابة نفسه أنماط التلف
  new RegExp(["وق", "f"].join("")),
  new RegExp(["عذ", "ari"].join("")),
  new RegExp(["بيوس", "f"].join("")),
  new RegExp(["تاش", "fين"].join("")),
  new RegExp(["الب", "ayan"].join("")),
  new RegExp(["المغ", "rib"].join("")),
  /الم\s*distorted/,
];

export function findMojibake(text: string): string[] {
  const hits: string[] = [];
  for (const re of MOJIBAKE) {
    if (re.test(text)) hits.push(re.source);
  }
  return hits;
}
