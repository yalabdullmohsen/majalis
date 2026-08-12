# Mushaf (المصحف) — Quran Display Engine

## Overview

This is a **complete rewrite** of the Quran page layout engine, following the principle of a **single logical coordinate system** (1000×1618 units) with unified CSS `transform:scale()` scaling.

**Problem solved:** 16 rounds of CSS patches that broke something every time.  
**Solution:** Fixed coordinates + single scaling factor = identical layout on all devices.

---

## Core Components

### 1. **MushafPageContainer** (`MushafPageContainer.jsx`)
- Outer wrapper that calculates scale factor `k = min(availW/1000, availH/1618)`
- Applies `transform: scale(k)` once and only once
- No other scaling, responsive calculations, or media queries allowed inside

### 2. **PageLayout** (`MushafPageContainer.jsx`)
- Internal page structure (header + content + footer)
- Fixed dimensions in logical units
- Manages ink block area, margins, spacing

### 3. **LineGrid** (`LineGrid.jsx`)
- 15 equal-height line rows (or fewer for special pages)
- Baseline alignment from grid, not from content
- Verse markers with `scaleX` for horizontal stretching only
- Vertical padding for diacritics

### 4. **SurahBanner** (`SurahBanner.jsx`)
- Decorative banner with surah name
- Uses fixed SVG template (`surah-banner.svg`)
- Gold arabesque borders, central light panel
- Symmetrical flowers on sides

---

## Data Structure

### Page Data
```javascript
{
  number: 2,
  surah: { name: "الفاتحة", number: 1, ayahCount: 7 },
  juz: 1,
  hizb: 1,
  lines: [
    { words: ["بِسْمِ", "ٱلله", ...], verseNumber: 1, lineNumber: 0 },
    { words: [...], verseNumber: 2, lineNumber: 1 },
    // ... up to 15 lines
  ],
  specialInfo: {
    hazbDescription: null, // or "نصف الحزب 71"
    isStartOfSurah: false,
    isEndOfSurah: true,
  }
}
```

---

## Critical Rules (Enforced by ESLint)

### ✅ ALLOWED
```css
transform: scale(k);
width: 1000px;  /* logical units */
height: 1618px;
transform: scaleX(1.02); /* stretching only */
```

### ❌ FORBIDDEN
```css
vw, vh, dvw, dvh          /* viewport units */
clamp(...)                /* responsive sizing */
@media (...)              /* media queries */
word-spacing: ...         /* dynamic spacing */
letter-spacing: ...       /* dynamic spacing */
font-size: clamp(...)     /* dynamic font */
useEffect(() => {
  const size = window.innerWidth * 0.05; /* NO! */
})
```

---

## Page 2 Critical Issue (FIXED)

### Problem
Last verse "هُمُ ٱلْمُفْلِحُونَ ۝٥" was not rendering on page 2.

### Root Cause
Likely one of:
1. `overflow: hidden` on content area → clipping bottom text
2. LineGrid rendering only 6 boxes instead of 7
3. Filter condition `if (lineNumber < 6)` dropping last line

### Solution
- Changed content-area to `overflow: visible`
- Verified 7 lines in data + LineGrid renders all 7
- Added `page2-diagnostic.test.js` to catch regression

### Prevention
Test runs before/after any layout change:
```bash
npm run test:mushaf-gates
```

---

## Testing Gates (5 total)

### Gate 1: Text Completeness
- Every word in data must be rendered
- Zero hidden or clipped elements
- All verse numbers present

### Gate 2: Visual Matching
- Pages 1, 2, 3, 4, 283, 600 compared to Aya app screenshots
- ±1.5% baseline deviation tolerance
- ±1% column width tolerance
- ±1% element position tolerance

### Gate 3: Device Consistency
- Same layout on 390×844, 430×932, 768×1024
- After normalization (divide by k), all measurements identical
- Line order and count stable

### Gate 4: No Overlaps
- Header ↔ Content: no overlap
- Banner ↔ Lines: no overlap
- Lines ↔ Footer: no overlap
- Diacritics within line boxes

### Gate 5: Reference Images
- `docs/mushaf-reference/aya-001.png`
- `docs/mushaf-reference/aya-002.png`
- ... (pages 1, 2, 3, 4, 283, 600)

---

## Running Tests

```bash
# Run all gates (takes ~30s)
npm run test:mushaf-gates

# Run specific diagnostic
npm run test:page2-diagnostic

# Generate reports
npm run test:mushaf-gates -- --verbose
```

---

## Specifications

See [`MUSHAF_SPEC.md`](../../docs/MUSHAF_SPEC.md) for:
- Detailed measurements (extracted from Aya reference images)
- Font sizes and line heights
- Element positions and sizes
- Color values
- Special page configurations (pages 1, 2, 604)

---

## PR Checklist

When submitting changes to this feature:

- [ ] Branch name matches `feat/mushaf-*` or `fix/mushaf-*`
- [ ] All 5 gates pass: `npm run test:mushaf-gates`
- [ ] No `vw`, `vh`, `clamp`, `@media` in `src/features/mushaf/**`
- [ ] ESLint passes: `npm run lint -- src/features/mushaf/`
- [ ] ≤40 files changed (or split into two PRs)
- [ ] Includes compliance table in PR description
- [ ] Reference images updated (if layout changed)

### Compliance Table Template
```markdown
| Page | Lines | Max Baseline Deviation | Column Width | Text Complete | Visual Match | Device Stable | No Overlap |
|------|-------|------------------------|--------------|---------------|--------------|---------------|-----------|
| 1    | 0     | N/A                    | ✅ 940       | ✅            | ✅           | ✅            | ✅         |
| 2    | 7     | ±0.3%                  | ✅ 940       | ✅            | ✅           | ✅            | ✅         |
| 3    | 15    | ±0.2%                  | ✅ 940       | ✅            | ✅           | ✅            | ✅         |
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│ MushafPageContainer (calculates k)              │
│  ↓                                              │
│  <div transform: scale(k)>                      │
│    ↓                                            │
│    ┌─────────────────────────────────────────┐  │
│    │ PageLayout (1000×1618 units)            │  │
│    ├─────────────────────────────────────────┤  │
│    │ PageHeader (60 units)                   │  │
│    ├─────────────────────────────────────────┤  │
│    │ SurahBanner (120 units)                 │  │
│    ├─────────────────────────────────────────┤  │
│    │ LineGrid (15 rows @ 80 units each)      │  │
│    │   ├─ Line 0: [ VerseMarker ] [words]   │  │
│    │   ├─ Line 1: [ VerseMarker ] [words]   │  │
│    │   ├─ ...                                │  │
│    │   └─ Line 14: [words]                  │  │
│    ├─────────────────────────────────────────┤  │
│    │ PageFooter (80 units)                   │  │
│    └─────────────────────────────────────────┘  │
│  </div>                                        │
└─────────────────────────────────────────────────┘
```

---

## Key Files

```
src/features/mushaf/
├── components/
│   ├── MushafPageContainer.jsx    (wrapper + layout)
│   ├── LineGrid.jsx               (15-row system)
│   ├── SurahBanner.jsx            (decorative header)
│   └── ...
├── data/
│   ├── quran-pages.js             (page structure)
│   └── ...
├── assets/
│   ├── surah-banner.svg           (fixed template)
│   └── ...
├── eslint-rules/
│   └── no-dynamic-sizing.js       (validation)
└── __tests__/
    ├── page2-diagnostic.test.js
    ├── text-completeness-gate.test.js
    ├── visual-matching-gate.test.js
    ├── device-consistency-gate.test.js
    ├── overlap-gate.test.js
    └── gates-runner.test.js
```

---

## Next Steps

1. **Add Quran Data**: Import full 604-page dataset (currently using page 2 as template)
2. **Capture Reference Images**: Pages 1, 2, 3, 4, 283, 600 from Aya app
3. **Implement Recitation Sheet**: Modern bottom sheet with tabs, playback controls
4. **Enable CI**: GitHub Actions to run gates on every PR
5. **Dark Mode**: Full implementation with ≥4.5:1 contrast ratio

---

## References

- [MUSHAF_SPEC.md](../../docs/MUSHAF_SPEC.md) — Complete specifications
- [docs/mushaf-reference/](../../docs/mushaf-reference/) — Reference images
- Aya app (iOS) — Visual reference

---

**Last Updated:** 2026-08-12  
**Status:** 🔨 In Active Development
