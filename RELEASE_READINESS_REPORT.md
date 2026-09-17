# Sunnah Release Readiness Report

**Date:** 2026-09-17  
**Branch / RC:** `cursor/sunnah-release-candidate`  
**Base knowledge:** `docs/project-knowledge/**` (commit `975505911…` + main stabilization `fc5fef274`)  
**Scope rule:** bug fixes · polish · launch blockers only (no new features / routes / redesign / mushaf architecture / CI / bundle / schema)

---

## Launch blockers

| Item | Status | Notes |
|---|---|---|
| Incorrect reading ref «البقرة آية 689» | **Cleared (code)** | Storage rejects global IDs; `parseVerseKey` now normalizes via `normalizeSurahAyah` (e.g. `2:689` → `5:20`). Display paths use normalize. |
| Floating back overlap | **Cleared (code)** | PageHero Suspense keeps `data-section-back` marker; lesson detail + search integrated back; FAB hide CSS + `hasInPageBackChrome` for `/search` and `/lessons/:id`. |
| Prayer notification uncertainty | **Partially cleared** | Prefs sync `alertsEnabled` ↔ `masterEnabled` (prior). Honest web vs native copy. **Device delivery still Unverified** — not a web RC blocker; is a **store/device** blocker. |
| Dark readability (confirmed) | **Cleared (code)** | Prior forest/hero fixes + RC polish for quran hub / lobby / review meta dark text. Contrast gate required on this lane. |
| LICENSE_RISKS (owner) | **Open (owner)** | QPC redistribution, adhan packs, library books, everyayah/mp3quran packaging — see `LICENSE_RISKS.md`. Blocks **store** 1.0.0, not web smoke. |
| Device prayer/audio + MFA/SQL approvals | **Open (owner/ops)** | Per `docs/project-knowledge/18_ROADMAP.md`. |

**Web RC launch blockers from this program:** none remaining in code paths above.  
**Store launch blockers:** licenses + real-device notification proof + owner ops items.

---

## Remaining low-priority issues

- Capacitor/TestFlight binary validation (separate from web RC).
- IA / admin surface cleanup (roadmap product quality — not P0).
- Library source completeness empty-states (content quality — owner content work).
- Pending rulings correctly stay unpublished (governance OK; continue monitoring).
- Visual polish beyond listed surfaces (Quran landing, categories, review cards, search, lesson details) — out of scope.

---

## Validation checklist

| Check | Result |
|---|---|
| no internal ids in user-facing ayah labels | Pass (normalize + storage reject) |
| no draft/pending in search cards | Pass (prior stabilization) |
| no fiqh-council search hrefs | Pass (prior) |
| no floating overlay on PageHero / lessons / search | Pass (this RC) |
| dead routes / broken nav (core) | Pass via production smoke paths |
| Light + Dark polish (targeted) | Pass (CSS polish; contrast lane on PR) |

---

## Final recommendation

**Ship web Release Candidate** after green `verify:ci` + GitHub contrast/visual + production smoke.

**Do not claim full App Store / Play launch** until:

1. Owner closes LICENSE_RISKS blockers.  
2. Real-device prayer LocalNotifications + audio proven.  
3. Explicit ops approvals (SQL security / Supabase MFA) if targeting store.

**Recommendation:** **GO for web RC**; **HOLD for store 1.0.0** pending owner/device items.
