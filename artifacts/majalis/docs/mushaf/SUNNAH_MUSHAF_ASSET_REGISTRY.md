# سجل أصول مصحف سُنّة — Asset Registry
**سياسة:** زخارف أصلية فقط · ممنوع الاستخراج من صور المرجع أو PDF غير مرخّص.

| assetId | origin | owner | license | createdForSunnah | redistributionAllowed | modificationAllowed | version | checksum | status |
|---------|--------|-------|---------|------------------|----------------------|---------------------|---------|----------|--------|
| qpc-v2-page-fonts | KFGQPC/QUL via quran.com CDN → `public/fonts/qpc-v2/` | King Fahd Complex / QUL | KFGQPC terms — **store sign-off pending** | false | restricted | no | v2 | per-file woff2 | **in use — pending written license** |
| quran-v2-page-json | Qurancdn API mushaf=1 → `public/data/quran-v2/` | data via QUL/quran.com pipeline | usage under project data policy; text is Quran | false | n/a (text) | **forbidden** | mushafId=1 | SOURCE.json fingerprint | **locked** |
| amiri-quran-fallback | Amiri project | Amiri authors | OFL | false | yes (OFL) | yes (OFL) | OFL | see `public/fonts/amiri-quran/` | fallback only |
| sunnah-page-frame-v1 | to be authored in-repo (SVG/CSS) | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD on create | **planned — original** |
| sunnah-surah-cartouche-v1 | to be authored in-repo | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD | **planned — original** |
| sunnah-fatiha-medallion-v1 | to be authored in-repo | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD | **planned — original** |
| sunnah-verse-marker-v1 | to be authored in-repo | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD | **planned — original** |
| sunnah-hizb-margin-marker-v1 | to be authored in-repo | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD | **planned — original** |
| sunnah-paper-texture-v1 | lightweight procedural/CSS only | سُنّة | proprietary Sunnah original | **true** | yes (app) | yes (Sunnah) | planned-p1 | TBD | **planned — no photo scan** |
| qcf-bsml | KFGQPC | KFGQPC | unsigned for redistribution | false | no | no | — | — | **not shipped** |
| madinah-page-pdf-images | reference photos / external PDF | third party | **unlicensed for app use** | false | no | no | — | — | **rejected — do not import** |

## قواعد التسجيل
1. أي أصل جديد يُضاف قبل الدمج مع `checksum` بعد الإنشاء.
2. `createdForSunnah: true` إلزامي لكل زخرفة بصرية جديدة.
3. أي أصل `origin` من صور المرجع أو Tracing مطابق → مرفوض.
4. خطوط QPC تبقى كما هي؛ لا يُستبدل خط الصفحة بخط مستخرج من صورة.
