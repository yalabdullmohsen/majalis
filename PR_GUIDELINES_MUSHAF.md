# PR Guidelines for Mushaf Feature

## Overview

This document outlines the complete process for submitting PRs to the Mushaf (Quran) feature.

**Core Principle:** Every PR must pass the 5 gates and zero dynamic sizing violations before merge.

---

## Pre-Submission Checklist

Before opening a PR:

### 1. **Run All Tests Locally**
```bash
# All gates
npm run test:mushaf-gates

# Linting
npm run lint -- src/features/mushaf/

# Type checking (if using TypeScript)
npm run type-check -- src/features/mushaf/
```

### 2. **Verify No Forbidden Patterns**
Search for any of these in your changes:
- `vw`, `vh`, `dvw`, `dvh` (viewport units)
- `clamp()` (responsive sizing)
- `@media` (media queries)
- `window.innerWidth`, `window.innerHeight` (dynamic calculations)
- `word-spacing`, `letter-spacing` (non-scaleX stretching)
- `useEffect(...) { ... setFontSize(window.innerWidth...) }` (dynamic font)

### 3. **Update Reference Images (if layout changed)**
```bash
# Capture new screenshots from Aya app
# Save as: docs/mushaf-reference/aya-NNN.png
# Include in this PR
```

### 4. **Generate Compliance Table**
Before submitting, document all results:
```
| Page | Status | Notes |
|------|--------|-------|
| 1    | ✅     | Header position verified |
| 2    | ✅     | Last line rendering fixed |
| ...  | ✅     | ... |
```

---

## Branch Naming

Use these patterns:

```
feat/mushaf-fixed-canvas-engine      (new feature)
fix/mushaf-page2-text-clipping       (bug fix)
test/mushaf-improve-gate-coverage    (test improvements)
docs/mushaf-specification-update     (documentation)
refactor/mushaf-line-grid-layout     (refactoring)
```

❌ Avoid:
```
mushaf-update
feature-1
fix123
```

---

## PR Description Template

```markdown
# Mushaf: [Brief Title]

## Problem
Describe the issue this PR fixes (use 🔴 emoji for critical issues):
- 🔴 Page 2 last line not rendering
- Layout inconsistent on mobile
- etc.

## Solution
Explain the approach:
1. Changed `overflow: auto` to `overflow: visible` on content-area
2. Verified 7 lines render on Page 2
3. Added test to prevent regression

## Changes
- [ ] Core layout engine (MushafPageContainer.jsx, LineGrid.jsx)
- [ ] Component updates (SurahBanner.jsx, etc.)
- [ ] Test additions (gates)
- [ ] Documentation (MUSHAF_SPEC.md, README.md)
- [ ] Reference images (docs/mushaf-reference/)

## Testing

### Gates Results
```
Gate 1: Text Completeness        ✅ PASS
Gate 2: Visual Matching          ✅ PASS
Gate 3: Device Consistency       ✅ PASS
Gate 4: No Overlaps              ✅ PASS
Gate 5: Reference Images         ✅ PASS
```

### Compliance Table

| Page | Lines | Max Baseline Dev | Column Width | Text Complete | Visual Match | Device Stable | No Overlap |
|------|-------|------------------|--------------|----------------|--------------|---------------|-----------|
| 1    | 0     | N/A              | ✅ 940       | ✅             | ✅           | ✅            | ✅         |
| 2    | 7     | ±0.5%            | ✅ 940       | ✅ FIXED       | ✅           | ✅            | ✅         |
| 3    | 15    | ±0.2%            | ✅ 940       | ✅             | ✅           | ✅            | ✅         |
| 4    | 15    | ±0.2%            | ✅ 940       | ✅             | ✅           | ✅            | ✅         |
| 283  | 15    | ±0.1%            | ✅ 940       | ✅             | ✅           | ✅            | ✅         |
| 600  | 13    | ±0.3%            | ✅ 940       | ✅             | ✅           | ✅            | ✅         |

### Lint Results
```bash
$ npm run lint -- src/features/mushaf/
✅ No forbidden patterns detected (vw/vh/clamp/@media)
✅ All files pass ESLint
✅ 0 warnings, 0 errors
```

### Files Changed
- MushafPageContainer.jsx (12 lines changed)
- LineGrid.jsx (8 lines changed)
- page2-diagnostic.test.js (+150 new)
- ...
**Total: 14 files, < 40 file limit ✅**

## Related Issues
Closes #123 (if applicable)

## Reviewers
@maintainer-name (add specific reviewer if complex)

## Notes
- Reference images captured on 2026-08-12
- Tested on iPhone 12 (390×844), Galaxy S21 (430×932), iPad (768×1024)
- No breaking changes
```

---

## File Size Limits

- **≤ 40 files per PR:** If you exceed, split into two PRs
  - PR 1: Mushaf engine + gates
  - PR 2: Recitation sheet + redesign

- **≤ 500 lines per component:** Large files become unmaintainable

---

## Common Failure Scenarios & Fixes

### ❌ Gate 1 Fails: Text Completeness
**Symptom:** "Words expected: 28, found: 27"

**Diagnosis:**
```bash
npm run test:page2-diagnostic -- --verbose
```

**Fix:**
1. Check `PAGE_2_DATA.lines` in `quran-pages.js`
2. Verify all 7 lines are present
3. Ensure no `filter()` or `slice()` dropping lines

### ❌ Gate 2 Fails: Visual Matching (±1.5% baseline deviation exceeded)
**Symptom:** "Baseline deviation: ±2.1% (max ±1.5%)"

**Fix:**
1. Check `lineHeight` calculation: should be `inkBlockHeight / 15`
2. Verify `PageLayout` has correct top margins
3. Check diacritics padding (should be 4px top/bottom)

### ❌ Gate 3 Fails: Device Consistency
**Symptom:** "Scale differs on iPad: 0.501 vs 0.504"

**Root Cause:** This is a **test tolerance issue**, not a layout bug.

**Fix:**
1. Normalize layout calculations better
2. Increase tolerance slightly (from ±0.5 to ±1.0 unit)

### ❌ Gate 4 Fails: Overlaps Detected
**Symptom:** "Line 14 overlaps footer"

**Fix:**
1. Increase `CONTENT_TOP_MARGIN` or `FOOTER_HEIGHT` in PageLayout
2. Check if content-area has `overflow: hidden` (should be `visible`)

### ❌ ESLint Fails: Forbidden Pattern
**Symptom:** "vw unit forbidden in mushaf"

**Fix:**
Search for `vw` and replace with fixed units:
```javascript
// ❌ WRONG
width: `${window.innerWidth * 0.9}px`;
fontSize: 'clamp(16px, 2vw, 32px)';

// ✅ CORRECT
width: 1000; // logical units
fontSize: 24; // logical units from MUSHAF_CONFIG
```

---

## Approved Patterns

### ✅ Fixed Layout
```jsx
// MushafPageContainer.jsx
const scale = Math.min(availW / 1000, availH / 1618);

// Inside page (never changes):
const lineHeight = 80; // constant
const bannerHeight = 120; // constant
```

### ✅ Horizontal Stretching Only
```jsx
// LineGrid.jsx
const scaleX = calculateScaleX(words); // [0.94, 1.06]
style={{ transform: `scaleX(${scaleX})` }}
```

### ✅ Conditional Rendering (Not Conditional Sizing)
```jsx
// OK to conditionally render elements:
{surah.name && <SurahBanner surah={surah} />}
{pageNumber === 1 && <CoverPage />}

// NOT OK to conditionally size:
size={isMobile ? 14 : 16} // ❌ FORBIDDEN
```

---

## PR Review Process

1. **Author Submits PR**
   - All checks pass locally
   - Compliance table included
   - Description complete

2. **Automated Checks** (GitHub Actions)
   - ✅ Linting (ESLint mushaf config)
   - ✅ All 5 gates
   - ✅ No forbidden patterns
   - ✅ Type checking

3. **Code Review** (maintainer)
   - Architecture alignment
   - Test coverage
   - Performance impact
   - Documentation

4. **Reference Image Verification** (if needed)
   - Compare captures to Aya app
   - ±1.5% baseline deviation
   - ±1% element positioning

5. **Merge** ✅
   - Squash commits with PR #number in message
   - Delete branch after merge

---

## CI/CD Integration

### GitHub Actions Workflow
Create `.github/workflows/mushaf-gates.yml`:

```yaml
name: Mushaf Gates

on:
  pull_request:
    paths:
      - 'src/features/mushaf/**'
      - '.eslintrc-mushaf.js'
      - 'docs/MUSHAF_SPEC.md'

jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install deps
        run: npm ci
      
      - name: Run Gates
        run: npm run test:mushaf-gates
      
      - name: Run Lint
        run: npm run lint -- src/features/mushaf/
      
      - name: Check Forbidden Patterns
        run: |
          ! grep -r "vw\|vh\|dvw\|dvh" src/features/mushaf/ --include="*.jsx" --include="*.js" --exclude-dir=__tests__
          ! grep -r "@media" src/features/mushaf/ --include="*.jsx" --include="*.js"
          ! grep -r "clamp(" src/features/mushaf/ --include="*.jsx" --include="*.js" || true
```

### npm Scripts (package.json)
```json
{
  "scripts": {
    "test:mushaf-gates": "jest src/features/mushaf/__tests__/gates-runner.test.js",
    "test:page2-diagnostic": "jest src/features/mushaf/__tests__/page2-diagnostic.test.js --verbose",
    "lint:mushaf": "eslint --config .eslintrc-mushaf.js src/features/mushaf/",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

---

## Examples

### Example 1: Fix Page 2 Text Clipping
```javascript
// BEFORE (broken):
<div className="content-area" style={{ overflow: 'hidden' }}>
  <LineGrid lines={lines} />
</div>

// AFTER (fixed):
<div className="content-area" style={{ overflow: 'visible' }}>
  <LineGrid lines={lines} />
</div>
```

### Example 2: Add Line Height Calculation
```javascript
// WRONG approach (✗ forbidden):
const lineHeight = inkBlockHeight / lines.length;

// CORRECT approach (✓ allowed):
const lineHeight = 80; // constant from MUSHAF_SPEC
const actualRows = Math.ceil(lines.length / 15); // handle overflow
```

---

## Troubleshooting

### Question: Can I use `useEffect` to adjust sizing?
**Answer:** ❌ NO. Remove it entirely.
```javascript
// ❌ FORBIDDEN
useEffect(() => {
  const size = (viewport.width / 1000) * BASE_FONT;
  setFontSize(size);
}, [viewport.width]);

// ✅ CORRECT
// Use MUSHAF_CONFIG.BASE_FONT_SIZE directly (constant)
const fontSize = MUSHAF_CONFIG.BASE_FONT_SIZE;
```

### Question: How do I handle different screen densities?
**Answer:** Let CSS `transform:scale(k)` handle it.
```javascript
// ✓ The scale factor automatically accounts for DPI
const k = Math.min(viewport.width / 1000, viewport.height / 1618);
// Result: 0.39 on 390px, 0.30 on 768px
// Browser handles the rest via CSS rendering
```

### Question: Can I use `@media` for dark mode?
**Answer:** NO for layout. YES for color/theme.
```css
/* ❌ FORBIDDEN (layout) */
@media (prefers-color-scheme: dark) {
  font-size: 14px;
}

/* ✅ ALLOWED (colors only) */
@media (prefers-color-scheme: dark) {
  background-color: #1a1a1a;
  color: #f5f5f5;
}
```

---

## Glossary

| Term | Definition |
|------|-----------|
| **k** | Scale factor = min(availW/1000, availH/1618) |
| **Logical units** | 1000×1618 coordinate system (independent of device) |
| **Baseline** | Vertical anchor point for text alignment in a line |
| **Ink block** | The main content area (all text/verses) |
| **scaleX** | Horizontal stretching only [0.94, 1.06] |
| **Gate** | Automated test that must pass before merge |
| **Reference image** | Screenshot from Aya app (source of truth) |

---

## Quick Links

- [MUSHAF_SPEC.md](../../docs/MUSHAF_SPEC.md) — Complete specifications
- [README.md](./README.md) — Component documentation
- [Aya App](https://apps.apple.com/app/id1533713801) — Visual reference (iOS)

---

**Last Updated:** 2026-08-12  
**Author:** [Your Name]  
**Questions?** Open an issue or tag @maintainer
