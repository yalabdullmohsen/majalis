# CI Throughput — قياس وإصلاح خط الأنابيب

تاريخ القياس: 2026-08-13 · عيّنة: آخر ~60 تشغيلًا عبر المستودع + آخر 20 لـ CI.

## جدول التشغيلات

| الاسم | متوسط (د) | وسيط (د) | مطلوب للدمج؟ | بلا داعٍ على PRs الويب؟ | إجراء هذا الـPR |
|---|---:|---:|---|---|---|
| CI (Verify build + شقيقات) | ~7.3 | ~8.4 | **نعم — Verify build فقط** | لا | الإبقاء؛ path-lane + concurrency موجودان |
| Vercel Check (PR) lint/typecheck/build | ~1.8 | ~2.0 | لا | **نعم — تكرار كامل لـ static+build** | أُوقف التشغيل التلقائي → `workflow_dispatch` فقط |
| Preview smoke | ~0.3 (+ انتظار نشر معاينة) | ~0.3 | لا | نعم إن أُوقف Preview | أُوقف التلقائي → `workflow_dispatch` |
| Auto Deploy main → production | ~1.8 | ~2.0 | لا (بعد الدمج) | لا | الإبقاء على `main` |
| Auto-ready and merge PRs | ~0.2 | ~0.2 | لا (مفعّل) | لا | الإبقاء |
| Resolve PR conflicts | ~0.4 | ~0.4 | لا | لا | الإبقاء |
| PR Safe Auto-Merge Report | ~0.4 | ~0.4 | لا | خفيف | الإبقاء |
| iOS Capacitor / native / TestFlight | — | — | لا | **نعم** (paths أصلًا) | الإبقاء + concurrency |
| mushaf-gates-nightly | — | — | لا | مجدول | الإبقاء |

## حماية `main` (مُثبَّت)

- Ruleset **Protect main** (`19782052`): الفحوصات المطلوبة = `Verify build` و`ci-required` (Skipped في بوابة إلزامية = فشل).
- `allow_auto_merge=true` · `delete_branch_on_merge=true`.
- **2026-08-13:** `strict_required_status_checks_policy` → `false` (لا يُجبر تحديث الفرع من main قبل كل دمج — يقلّل إعادة تشغيلات CI على الفروع المتراكمة).
- **2026-08-17:** `Color contrast` و`visual-snapshot` ضمن `needs` لـ Verify build عند `need_build`؛ `ci-required` يجمع البوابات ويرفض `Skipped`.

## ما طُبِّق في `fix/ci-throughput`

1. إلغاء تكرار **Vercel Check (PR)** على كل PR.
2. إيقاف **Preview smoke** التلقائي (لا معاينة = لا smoke مرتبط بها).
3. `artifacts/majalis/vercel.json`: نشر Git على **`main` فقط** (لا Preview لكل PR).
4. `concurrency.cancel-in-progress` على workflows كانت بلا مجموعة.
5. وثائق: هذا الملف + `REPO_INDEX.md` + بروتوكول الوكيل في `AGENT_THROUGHPUT.md`.

## الهدف المقيس

| مقياس | قبل (عيّنة) | هدف |
|---|---|---|
| PR → دمج (بعد خضرة Verify) | غالبًا >٦د بسبب التكرار/الانتظار/strict | **< ٦ دقائق** لـ PR بلا مصحف |
| انتظار الوكيل لـCI | عشرات الدقائق | **صفر** (`AGENT_THROUGHPUT.md`) |
| تشغيلات مكررة على نفس ref (lint+build خارج CI) | Vercel Check + CI | **صفر** تلقائيًا |

## ملاحظات

- Color contrast و visual-snapshot ضمن `needs` لـ Verify build عندما `need_build=true` (Skipped = فشل).
- المجمّع `ci-required` يفشل إن تُخطّيت بوابة إلزامية.
- بوابات المصحف داخل CI تُفعَّل بـ path-lane عند تغيير مسارات المصحف فقط؛ الكامل ليلاً.
- كاش التبعيات موجود في `.github/actions/setup-workspace` (pnpm store + node_modules + vite + tsbuildinfo + Playwright).
