# سجل أصول مصحف سُنّة — Asset Registry
**سياسة:** زخارف أصلية فقط · ممنوع الاستخراج من صور المرجع أو PDF غير مرخّص.

| assetId | origin | owner | license | createdForSunnah | redistributionAllowed | modificationAllowed | version | checksum | status |
|---------|--------|-------|---------|------------------|----------------------|---------------------|---------|----------|--------|
| qpc-v2-page-fonts | KFGQPC/QUL via quran.com CDN → `public/fonts/qpc-v2/` | King Fahd Complex / QUL | KFGQPC terms — **store sign-off pending** | false | restricted | no | v2 | per-file woff2 | **in use — pending written license** |
| quran-v2-page-json | Qurancdn API mushaf=1 → `public/data/quran-v2/` | data via QUL/quran.com pipeline | usage under project data policy; text is Quran | false | n/a (text) | **forbidden** | mushafId=1 | SOURCE.json fingerprint | **locked** |
| amiri-quran-fallback | Amiri project | Amiri authors | OFL | false | yes (OFL) | yes (OFL) | OFL | see `public/fonts/amiri-quran/` | fallback only |
| sunnah-page-frame-v1 | authored in-repo (CSS absolute frame) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a (css) | **implemented** |
| sunnah-surah-cartouche-v1 | authored in-repo (`MushafSurahBanner` / SunnahSurahTitleCartouche) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **implemented** |
| sunnah-fatiha-medallion-v1 | authored in-repo (CSS ellipse, page 1 only) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **implemented** |
| sunnah-baqarah-medallion-v1 | authored in-repo (CSS ellipse, page 2 lead) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **implemented** |
| sunnah-verse-marker-v1 | existing QPC end-glyph + CSS chrome | سُنّة | proprietary Sunnah styling | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **partial — chrome only** |
| sunnah-hizb-margin-marker-v1 | authored in-repo (`.nm-page__section-mark`) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **implemented** |
| sunnah-paper-texture-v1 | token `--mushaf-paper-light` only (no photo) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | token-v1 | n/a | **implemented** |
| sunnah-warm-yellow-tokens-v1 | authored in-repo (`mushaf-warm-yellow-tokens.ts` + CSS vars) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | token-v1 | n/a | **implemented** |
| sunnah-verse-marker-floral-v1 | authored in-repo (CSS clip-path floral, same 0.98em box) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | css-v1 | n/a | **implemented** |
| qcf-bsml | KFGQPC | KFGQPC | unsigned for redistribution | false | no | no | — | — | **not shipped** |
| madinah-page-pdf-images | reference photos / external PDF | third party | **unlicensed for app use** | false | no | no | — | — | **rejected — do not import** |

## قواعد التسجيل
1. أي أصل جديد يُضاف قبل الدمج مع `checksum` بعد الإنشاء.
2. `createdForSunnah: true` إلزامي لكل زخرفة بصرية جديدة.
3. أي أصل `origin` من صور المرجع أو Tracing مطابق → مرفوض.
4. خطوط QPC تبقى كما هي؛ لا يُستبدل خط الصفحة بخط مستخرج من صورة.
