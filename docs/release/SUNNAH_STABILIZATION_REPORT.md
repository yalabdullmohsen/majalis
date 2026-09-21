# SUNNAH STABILIZATION — تقرير حي

**الحالة:** `PARTIAL`  
**آخر تحديث:** 2026-09-21 (Full Remediation Wave 8 — deep links + lessons-guide)  
**Source (`origin/main` base):** `98e29a655bc48a461e469cfc16fe154cc095c28a`  
**Production:** re-check `version.json` after merge · Store **HOLD**  
**مرجع الحقيقة:** `docs/release/CURRENT_PROJECT_STATUS.md` · `docs/release/CURRENT_RELEASE_TRUTH.md`  
**ملاحظة:** pins الأقدم = **STALE_REPORT** لسطح الحالة النشط

## موجات

| موجة | الحالة | PR | ملاحظة |
|---|---|---|---|
| PR-1 تثبيت + triage | **MERGED** | #2181 | triage + إغلاق مسودات |
| PR-2 عزل Admin | **MERGED** | #2182 | لا أدوات فوق التطبيق العام |
| PR-3 Design tokens | **MERGED** | #2183 | `--sunnah-*` + تقرير DS |
| PR-4 رئيسية/قرآن/أنبياء | **MERGED** | #2184 | استئناف حقيقي + ذهب + لا clip |
| PR-5 أقسام عامة | **MERGED** | #2185 | شرائط RTL + سطوح + أذكار/فقه/معرفة |
| PR-6 مصحف ص١–ص٢ | **MERGED** | #2186 | توازن ص١–ص٢ + تباين علامة |
| PR-7 legacy cleanup | **MERGED** | #2187 | SAFE_REMOVE ميت فقط — `docs/release/LEGACY_CLEANUP_REPORT.md` · بقايا SAFE_REMOVE/NEEDS_PORT → Remediation PR-12 |
| PR-8 Admin v3 Shell | **MERGED** | #2196 | `/admin/v3` shell |
| PR-9 مراكز Admin | **MERGED** | #2197 | Wave 6 |
| PR-10 حذف Legacy Admin | **BLOCKED** | — | Wave 7: entry migrated · delete still BLOCKED |
| PR-11 صدق المحتوى | **MERGED** | #2195 | بلا نشر آلي · Wave 4 |
| PR-12 تحقق شامل | **PENDING** | — | Remediation PR-12 / Waves 9–14 |

## مجاور (ليس ضمن ترقيم الاستقرار، مدموج على نفس الـtip)

| بند | PR | حالة |
|---|---|---|
| دخولية رسمية واحدة | #2188 | MERGED |
| أذان ميداني CC0 (`field` / `field-full`) | #2189 | MERGED · الإنتاج يعتمدها · المتجر ما زال HOLD |
| مزامنة حقيقة الإصدار (سابق) | #2190 | MERGED |
| حراسة أصول المتجر | #2191 | MERGED · HOLD باقٍ |
| Full Remediation Waves 1–7 | #2192–#2198 | MERGED |
| Full Remediation Wave 8 (deep links) | — | IN_PROGRESS |

## معيار الإغلاق

لا يُعلن `SUNNAH_STABILIZATION_COMPLETE` حتى تتحقق كل بنود البرنامج في موجة PR-12 مع أدلة جهاز/مالك حيث لزم.
