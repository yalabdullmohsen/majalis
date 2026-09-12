# سُنّة — Protected Content Registry (Cleanup P0)

## Source of truth

Machine registry (do not fork):

`artifacts/majalis/lib/content-ops/data/protected-content-registry.json`

Owned by Content Ops P0. Cleanup must **read** it, never weaken it.

## Classes

| Class | Examples | Cleanup rule |
|---|---|---|
| Quran / Uthmani / tashkeel | `public/data/quran/**`, mushaf maps | **protected_content** — no formatter/codemod/spellcheck |
| Hadith matn / isnad / grade | `public/data/hadith/**` | same |
| Adhkar / dua reference | adhkar data paths | same |
| Fiqh / fatwa / aqeedah reference | rulings data | same |
| Tafsir reference | tafsir corpora | same |
| Scholar attributions | quotations | specialist review |
| Historical disputed / fadaail | sensitive narratives | no generative rewrite |

## Cleanup-specific prohibitions

1. Do not “normalize” Arabic religious text for TTS dictionaries by rewriting source files.
2. Do not delete unused-looking ayah/hadith JSON because knip/ts-prune says unused — corpora may be dynamically loaded.
3. Do not move religious files without hash/parity tests.
4. Audio reader / TTS must never treat protected spans as speakable (separate feature gates).

## Verification

```bash
node scripts/cleanup/p0-gate.mjs
pnpm --filter @workspace/majalis run content-ops:p0-gate
```


## Extension for cleanup docs

See also brand/content safety in Content Ops reports. Any new protected glob must be added to the JSON registry first, then mirrored here in prose.
