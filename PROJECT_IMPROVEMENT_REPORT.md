# Project Improvement Report

## Scope

- Flutter app: `artifacts/mushafi`
- React site: `artifacts/majalis`

## Structure

- Flutter app:
  `artifacts/mushafi`

- React site:
  `artifacts/majalis`

## Findings

- Flutter cleanup already landed: new mushaf (`features/mushaf`) and new tasmee3 (`features/tasmee3`) are routed from `HomeShell`; legacy UI is under `lib/deprecated/`.
- Safe ASR defaults already off (upload / WebSocket / PCM).
- User-facing tasmee3 copy mixed technical English (`ASR`, `WebSocket`, `PCM`) and harsh “أخطاء/ممتاز” wording.
- Quran asset check passes with metadata warning (2 pages vs 604 expected) — not treated as complete page metadata.
- React site had brand slip “مجالس”, English DB codes on About/Methodology, weak hero brand signal, and small Arabic spelling/consistency issues.
- CocoaPods still required locally for iOS archive.

## Risks

- Dual `@types/react` can break monorepo typecheck via unused shadcn leftovers (mitigated previously).
- Do not rewrite Quran assets or invent religious claims.
- Do not enable server audio upload by default.

## Flutter Improvements

- Softened result wording: «قراءة متقاربة»، «مواضع تحتاج مراجعة»، «المتوقع / ما سُمع».
- Arabic labels for ASR settings: عنوان الخادم، مفتاح الوصول، التسميع المباشر، بث صوتي مباشر.
- Settings/privacy/support copy no longer exposes `fallback` / `speech_to_text` / class names to end users.
- HomeShell footer copy clarified; mushaf hero copy refined.
- PCM error string Arabicized for user-facing path.
- Confirmed: badges «المصحف الجديد» / «التسميع الجديد» remain; mic does not auto-start; diagnostics redact API key / Quran / audio.

## React Improvements

- Privacy: brand «المجلس العلمي»، grammar يُحتفَظ، drop raw `localStorage` wording.
- About/Methodology: Arabic-only review/provenance wording (no code field dumps).
- Home hero: brand eyebrow «المجلس العلمي» + CSS.
- Unified About nav label to «من نحن» (footer + sitemap).
- Spelling: تعرّف، تعذّر، تُرجَع؛ theme chip clearer; RecitationTest privacy brand fix.

## Arabic Copy Fixes

- Flutter user surfaces + React shell/legal/marketing strings listed above.
- Did **not** mass-edit generated encyclopedia/glossary/quiz seeds (would be risky and unrelated to product claims).

## Technical Fixes

- No architecture rewrite.
- Legacy Flutter UI remains isolated in `lib/deprecated/`.
- Safe runtime ASR defaults unchanged (still false/empty).

## Privacy / Safety Checks

- Upload / live WS / PCM default off.
- Diagnostics redact secrets and exclude Quran/audio.
- Product claims use approximate/helper language.

## Deprecated / Isolated Code

- `artifacts/mushafi/lib/deprecated/legacy_mushaf/`
- `artifacts/mushafi/lib/deprecated/legacy_shell/`
- Not reconnected to GoRouter.

## Commands Run

```bash
# Flutter
cd artifacts/mushafi
flutter pub get
flutter analyze   # No issues found
flutter test      # All tests passed
dart run scripts/check_quran_asset.dart  # passed + metadata warning

# React
pnpm --filter @workspace/majalis run lint   # passed
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build  # passed
```

## Results

- Flutter analyze: pass
- Flutter test: pass
- Quran asset check: pass (metadata incomplete warning)
- Majalis lint: pass
- Majalis build: pass

## Remaining Issues

- `quran_page_metadata.json` مزامَن مع majalis (604 صفحة) عبر `scripts/sync-mushaf-page-metadata.mjs` — راجع `UNIFIED_MUSHAF.md`.
- Local iOS archive needs CocoaPods (`pod` not installed on this machine).
- Responsive visual QA of majalis still manual in browser.
- Large content seeds (glossary filler dots, encyclopedia) not fully copy-edited in this pass.

## Next Required Manual Steps

1. Flutter: install CocoaPods → `pod install` → Xcode Archive → TestFlight (see `artifacts/mushafi/TESTFLIGHT_UPLOAD_STEPS.md`).
2. If TestFlight already has build `1`, bump `pubspec.yaml` to `1.0.0+2` before archive.
3. Spot-check majalis.com home/about/privacy/methodology on mobile after deploy.
4. Optional later: complete authentic 604-page mushaf metadata from a trusted source (do **not** invent).

## Improvements Done

- See Flutter / React / Copy / Privacy sections above.
- Docs: this report + `FINAL_CHECKLIST.md`.
