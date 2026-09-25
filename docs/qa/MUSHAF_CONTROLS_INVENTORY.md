# جرد أزرار المصحف — Controls Inventory

**Generated:** 2026-09-25T09:45:52.253Z  
**Method:** static source inventory (exact counts from `CONTROLS` list; not estimates)

## Summary

| Metric | Count |
|---|---:|
| Total interactive mushaf controls audited | **30** |
| PASS | 23 |
| FIXED (this PR) | 7 |
| BROKEN remaining | 0 |
| NO_OP remaining | 0 |
| REMOVED | 0 |
| Blocked by overlay | 0 |

## Root causes fixed

1. **SYSTEM/LIGHT/DARK — ATTRIBUTE_NOT_UPDATED:** `NewMushafReader` now binds `data-mushaf-appearance={mushafAppearanceResolved}` and updates it on preference/OS scheme change. Explicit light remapper added.
2. **Page arrows — CSS_HIDDEN:** `data-chrome="0"` rules no longer hide arrows when `data-page-arrows="1"`. Visibility no longer requires `chromeOpen`.
3. **Ayah marker clarity:** external size stays `1.15em`; number `1.52em`; soft 8-petal clip; `inline-grid` + `place-items:center`.

## Contracts

```json
{
  "appearanceBoundOnRoot": true,
  "lightRemapper": true,
  "arrowsIndependentOfChrome": true,
  "arrowsCssAllowsWhenEnabled": true,
  "singleAyahMarker": true,
  "externalMarkSize115": true,
  "numberSize152": true
}
```

## Controls

| ID | Label | Status | Handler |
|---|---|---|---|
| `mushaf-toolbar-exit` | خروج | PASS | onExit |
| `mushaf-focus-reading-toggle` | إخفاء/إظهار أدوات | PASS | onToggleFocusReadingMode |
| `mushaf-goto-page-btn` | رقم الصفحة | PASS | onGotoOpenChange(true) |
| `mushaf-search` | بحث | PASS | onSearch |
| `mushaf-index` | فهرس | PASS | onIndex |
| `mushaf-play-page` | تشغيل | PASS | onPlayPage |
| `mushaf-controls-more` | المزيد | PASS | onMoreOpenChange |
| `mushaf-display-mode-SYSTEM` | تلقائي | FIXED | onChange(SYSTEM) |
| `mushaf-display-mode-LIGHT` | نهاري | FIXED | onChange(LIGHT) |
| `mushaf-display-mode-DARK` | ليلي | FIXED | onChange(DARK) |
| `mushaf-page-arrows-toggle` | إظهار أسهم تقليب الصفحات | FIXED | onPageArrowsEnabledChange |
| `mushaf-page-arrow-next` | الصفحة التالية | FIXED | onNext |
| `mushaf-page-arrow-prev` | الصفحة السابقة | FIXED | onPrev |
| `mushaf-bookmarks-manager-link` | إدارة الفواصل | PASS | href |
| `mushaf-controls-more-close` | إغلاق | PASS | onMoreOpenChange(false) |
| `mushaf-goto-prev` | السابق (انتقال) | PASS | onClick stepper |
| `mushaf-goto-next` | التالي (انتقال) | PASS | onClick stepper |
| `mushaf-goto-dial` | عداد الصفحات | PASS | jumpToPage |
| `mushaf-goto-submit` | انتقال | PASS | onSubmit |
| `mushaf-goto-cancel` | إلغاء | PASS | closeGoto |
| `nm-verse-menu-play` | تشغيل الآية | PASS | onPlay |
| `nm-verse-menu-tafsir` | تفسير | PASS | onTafsir |
| `nm-verse-menu-copy` | نسخ | PASS | onCopy |
| `nm-verse-menu-bookmark` | فاصل | PASS | onBookmark |
| `nm-verse-menu-close` | إغلاق قائمة الآية | PASS | onClose |
| `mushaf-ayah-hit` | آية (ضغط) | PASS | ayah hit targets |
| `mushaf-ayah-marker` | فاصل الآية | FIXED | none (decorative) |
| `mushaf-empty-tap-chrome` | ضغط وسط الصفحة | PASS | onTapEmpty |
| `mushaf-page-scrubber` | شريط الصفحات | PASS | onPageChange |
| `mm-audio-dock` | مشغّل التلاوة | PASS | recitation + audio engine |
