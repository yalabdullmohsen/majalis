/**
 * Compact Aho-Corasick multi-pattern matcher for Arabic (normalized) corpora.
 * Plus bitwise char-mask prefilter for fast reject. Logic-only — no UI.
 */

export type AhoMatch = { patternIndex: number; end: number };

type AhoNode = {
  next: Map<string, number>;
  fail: number;
  out: number[]; // pattern indices ending here
};

export class AhoCorasick {
  private nodes: AhoNode[] = [{ next: new Map(), fail: 0, out: [] }];
  private built = false;

  add(pattern: string, index: number): void {
    if (!pattern) return;
    this.built = false;
    let v = 0;
    for (const ch of pattern) {
      let to = this.nodes[v]!.next.get(ch);
      if (to == null) {
        to = this.nodes.length;
        this.nodes[v]!.next.set(ch, to);
        this.nodes.push({ next: new Map(), fail: 0, out: [] });
      }
      v = to;
    }
    this.nodes[v]!.out.push(index);
  }

  build(): void {
    const q: number[] = [];
    for (const [, to] of this.nodes[0]!.next) {
      this.nodes[to]!.fail = 0;
      q.push(to);
    }
    while (q.length) {
      const r = q.shift()!;
      for (const [ch, u] of this.nodes[r]!.next) {
        q.push(u);
        let v = this.nodes[r]!.fail;
        while (v && !this.nodes[v]!.next.has(ch)) v = this.nodes[v]!.fail;
        const f = this.nodes[v]!.next.get(ch) ?? 0;
        this.nodes[u]!.fail = f === u ? 0 : f;
        this.nodes[u]!.out.push(...this.nodes[this.nodes[u]!.fail]!.out);
      }
    }
    this.built = true;
  }

  /** Find all pattern hits in text. Returns unique pattern indices by default. */
  search(text: string, { unique = true }: { unique?: boolean } = {}): AhoMatch[] {
    if (!this.built) this.build();
    const hits: AhoMatch[] = [];
    const seen = unique ? new Set<number>() : null;
    let v = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      while (v && !this.nodes[v]!.next.has(ch)) v = this.nodes[v]!.fail;
      v = this.nodes[v]!.next.get(ch) ?? 0;
      for (const pi of this.nodes[v]!.out) {
        if (seen) {
          if (seen.has(pi)) continue;
          seen.add(pi);
        }
        hits.push({ patternIndex: pi, end: i });
      }
    }
    return hits;
  }

  hasAny(text: string): boolean {
    return this.search(text, { unique: true }).length > 0;
  }
}

/**
 * Bitwise character presence mask (61 buckets) for O(1) subset reject.
 * Uses number bit ops where possible; falls back to two 32-bit lanes.
 */
export function charBitmask(s: string): { hi: number; lo: number } {
  let hi = 0;
  let lo = 0;
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i);
    const bucket = cp % 61;
    if (bucket < 32) lo |= 1 << bucket;
    else hi |= 1 << (bucket - 32);
  }
  return { hi, lo };
}

/** True if every bit set in needle is also set in hay (needle ⊆ hay). */
export function bitmaskContains(
  hay: { hi: number; lo: number },
  needle: { hi: number; lo: number },
): boolean {
  return (hay.lo & needle.lo) === needle.lo && (hay.hi & needle.hi) === needle.hi;
}

/** Build AC over patterns; empty patterns skipped. */
export function buildAho(patterns: string[]): AhoCorasick {
  const ac = new AhoCorasick();
  patterns.forEach((p, i) => ac.add(p, i));
  ac.build();
  return ac;
}
