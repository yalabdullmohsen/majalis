# Legacy Admin Inventory — جرد لوحة التحكم الحالية

**الحالة:** PR-1 · Audit فقط · **لا حذف · لا ترحيل · لا تغيير صلاحيات/CRUD**  
**تاريخ الجرد:** 2026-09-20  
**فرع المصدر:** `origin/main` عند `3c975e027`  
**منتج الويب:** `artifacts/majalis`  
**قرار المنتج:** Admin الحالية = **Legacy**. إعادة البناء = **Admin v3 Complete Rebuild** (ليست Refactor).

مرجع سابق مختصر: `docs/project-knowledge/13_ADMIN_AND_OPERATIONS.md`  
هذا الملف هو **مصدر الحقيقة للجرد** قبل أي موجة بناء/ترحيل/حذف.

---

## 1. ملخص تنفيذي

| مقياس | قيمة تقريبية |
|---|---:|
| مسارات `/admin*` في كتالوج المسارات | 25 |
| صفحات standalone حية (بعد التحويلات) | ~15 |
| أقسام داخل `/admin?section=` | 40 |
| إجمالي شاشات ويب إدارية ≈ | ~55 |
| ملفات `src/views/admin/**` | 67 |
| ملفات `src/components/admin/**` | 13 |
| معالجات API `lib/api-handlers/admin/**` | 32 |
| تبويبات Expo mobile admin | 6 |
| مداخل SEO admin (noindex) | 22 (ناقص `review-hub`) |

**المشكلات المؤكدة (من المنتج + الجرد):**

- Navigation/Drawer غير قابلة للتوسع وتصنيف ضعيف  
- تكرار مراكز: مراجعة · محتوى · أتمتة · AI · لوحة قيادة  
- لا Dashboard تشغيلية موحّدة  
- كثافة معرفية عالية · ضغطات كثيرة  
- Admin فوق التطبيق العام (FAB «مشرف» / «تحرير الصفحة» / QuickEdit)  
- تجربة هاتف ضعيفة (Drawer طويل بلا Bottom Nav إداري)

---

## 2. هيكل Admin v3 المستهدف (مرجع ترحيل)

| مركز v3 | دور |
|---|---|
| **Home** | نظرة اليوم · محتوى جديد · مراجعات · مستخدمون · أخطاء · نشاط · Quick Actions |
| **Content** | إدارة موحّدة: قرآن · حديث · فقه · عقيدة · فرق · تفسير · مقالات · تعريفات · دروس |
| **Review Center** | Unified Review Queue + فلاتر فقط |
| **Users** | Users · Roles · Permissions · Activity · Suspensions · Audit Log |
| **Notifications** | قنوات الإشعار · Telegram/push · سياسات |
| **Analytics** | Analytics Workspace موحّد |
| **Automation** | AI · CMS Automation · Workflows · Schedulers · Queues · Processors |
| **System** | DB · Servers · Cache · Jobs · Storage · Monitoring |
| **Settings** | كل الإعدادات مجمّعة |

**تنقّل هاتف (v3):** Bottom Nav بـ 5 عناصر فقط: الرئيسية · المحتوى · المراجعة · التحليلات · المزيد  
**المزيد:** Users · Automation · System · Settings · Notifications

---

## 3. Routes — `/admin*`

مصدر التشغيل: `artifacts/majalis/src/AppRoutes.tsx`  
الكتالوج: `artifacts/majalis/src/app/router/routes.ts`  
الحراسة: `AdminLazyRoute` → `AdminRouteGuard`

| المسار | المكوّن / السلوك | وجهة v3 المقترحة |
|---|---|---|
| `/admin` | `AdminPage` + `?section=` (~40) | Shell يُستبدل بـ Admin v3 |
| `/admin/users` | Redirect → `?section=users` | Users |
| `/admin/dashboard` | `AdminDashboardPage` → غالبًا review-hub | Home |
| `/admin/review-hub` | `ReviewHubPage` | Review Center |
| `/admin/review-center` | `AutomationReviewPage` | Review Center |
| `/admin/automation/review` | نفس السابق (alias) | Review Center |
| `/admin/auto-content` | `AutoContentPage` | Automation (+ Content استيراد) |
| `/admin/content` | Redirect → auto-content | Content / Automation |
| `/admin/content-production` | `ContentProductionDashboardPage` | Automation |
| `/admin/automation/content-production` | alias | Automation |
| `/admin/automation/center` | `AutomationCenterPage` | Automation |
| `/admin/automation` | Redirect → center | Automation |
| `/admin/automation/dashboard` | `AutomationDashboardPage` | Automation |
| `/admin/automation/platform` | `MajlisKnowledgeEnginePage` | Automation |
| `/admin/autonomous-platform` | `AutonomousPlatformPage` | Automation |
| `/admin/sources` | `AutomationSourcesPage` | Automation / System |
| `/admin/automation/sources` | alias | Automation |
| `/admin/content-import/url` | `LessonImportUrlPage` | Content (استيراد) |
| `/admin/content-import/image` | `LessonImportImagePage` | Content (استيراد) |
| `/admin/import` | Redirect → url import | Content |
| `/admin/integrations/instagram` | `InstagramIntegrationPage` | Automation / Notifications |
| `/admin/feature-status` | `FeatureStatusPage` | System / Analytics |
| `/admin/universities` | `UniversitiesAdminPage` | Content |
| `/admin/fiqh-review` | Redirect → `/admin` (ميت) | — احذف بعد الترحيل |
| `/admin/fiqh-quality` | Redirect → `/admin` (ميت) | — احذف بعد الترحيل |

**مرتبط غير `/admin*`:** `/internal/status` محمي بـ `AdminLazyRoute` → System (Monitoring).

**فجوة SEO:** `/admin/review-hub` موجود في `routes.ts` وغائب عن بعض إدخالات `seo-routes.json`.

---

## 4. Shell sections — `/admin?section=`

مصدر التنقّل: `NAV_GROUPS` في `views/admin/AdminShell.tsx`  
التصيير: `views/AdminPage.tsx`

| مفتاح القسم | التسمية في الواجهة | مجموعة NAV الحالية | وجهة v3 |
|---|---|---|---|
| `dashboard` | لوحة التحكم | رئيسية | Home |
| `submissions` | مقترحات المجتمع | مراجعة | Review Center |
| `reports` | التقارير | مراجعة | Review Center / Analytics |
| `scholarly-verification` | التوثيق العلمي | مراجعة | Review Center |
| `religious-calendar-review` | مراجعة التقويم الشرعي | مراجعة | Review Center |
| `categories` | أبواب العلم (تصنيفات) | محتوى | Content |
| `lessons` | الدروس | محتوى | Content |
| `sheikhs` | المشايخ | محتوى | Content |
| `library` | المكتبة | محتوى | Content |
| `fawaid` | الفوائد | محتوى | Content |
| `adhkar` | الأذكار | محتوى | Content |
| `miracles` | إشارات كونية | محتوى | Content |
| `qa` | الأسئلة والأجوبة | محتوى | Content |
| `quiz` | المسابقة | محتوى | Content |
| `rulings` | الأحكام الشرعية | محتوى متقدّم | Content |
| `annual-courses` | الدورات العلمية | محتوى متقدّم | Content |
| `dawah` | التعريف بالإسلام | محتوى متقدّم | Content |
| `week-day-facts` | أيام الأسبوع | محتوى متقدّم | Content |
| `arbaeen-love` | الأربعون في محبة رب العالمين | محتوى متقدّم | Content |
| `researches` | الأبحاث الشرعية | محتوى متقدّم | Content |
| `users` | المستخدمون | نظام | Users |
| `error-logs` | سجل الأخطاء | نظام | System |
| `image-import` | استخلاص من صور | أدوات | Content / Automation |
| `smart-cms` | CMS الذكي | أدوات | Automation |
| `aggregator` | محرك التجميع | أدوات | Automation |
| `knowledge-engine` | Auto Knowledge | أدوات | Automation |
| `telegram` | Telegram | أدوات | Notifications |
| `prophet-stories` | قصص الأنبياء | أدوات | Content |
| `islamic-stories` | القصص الإسلامية | أدوات | Content |
| `updates` | المستجدات | أدوات | Content |
| `universities` | دليل الجامعات | أدوات | Content |
| `search-analytics` | تحليل البحث | ذكاء | Analytics |
| `verified-knowledge` | المعرفة الموثقة | ذكاء | Review / Content |
| `knowledge-reasoning` | محرك الاستدلال | ذكاء | Automation |
| `autonomous-ai` | المنظومة الذاتية | منصات | Automation |
| `global-reference` | المرجع العالمي | منصات | Automation / Content |
| `islamic-intelligence` | الاستخبارات العلمية | منصات | Automation |
| `open-platform` | Open Platform | منصات | Automation / System |
| `governance` | الحوكمة المؤسسية | منصات | Settings / Users |
| `knowledge-graph` | الرسم البياني | منصات | Content / Analytics |
| `settings` | الإعدادات | منصات | Settings |

**ملاحظة جرد:** `telegram` يُصيَّر مرتين في `AdminPage.tsx` (تكرار فرع).  
**يتيم غير مربوط في AdminPage:** `LearningPathsSection` + `learning-paths/*` (موجود على القرص، غير في جدول الأقسام الحي).

---

## 5. صفحات standalone (ملفات)

المسار الأساسي: `artifacts/majalis/src/views/admin/`

| ملف | دور | v3 |
|---|---|---|
| `AdminShell.tsx` | Drawer/Sidebar أسود طويل | **يُحذف في PR-13** بعد Shell v3 |
| `AdminUI.tsx` / `AdminModal.tsx` / `AdminSectionToolbar.tsx` | UI مشترك | يستبدل بـ Design System v3 |
| `AdminDashboardPage.tsx` | تحويل/لوحة | Home |
| `ReviewHubPage.tsx` | خانة المراجعة | Review Center |
| `AutomationReviewPage.tsx` | مركز مراجعة أتمتة | Review Center |
| `AutoContentPage.tsx` | استيراد تلقائي | Automation |
| `ContentProductionDashboardPage.tsx` | إنتاج محتوى | Automation |
| `AutomationCenterPage.tsx` | مركز أتمتة | Automation |
| `AutomationDashboardPage.tsx` | لوحة أتمتة | Automation |
| `AutomationSourcesPage.tsx` | مصادر | Automation |
| `MajlisKnowledgeEnginePage.tsx` | MKE | Automation |
| `AutonomousPlatformPage.tsx` | AKP | Automation |
| `LessonImportUrlPage.tsx` / `LessonImportImagePage.tsx` / `LessonImportShared*` | استيراد دروس | Content |
| `InstagramIntegrationPage.tsx` / `InstagramManualAssistPanel.tsx` | إنستغرام | Automation / Notifications |
| `FeatureStatusPage.tsx` | حالة الميزات | System |
| `UniversitiesAdminPage.tsx` | جامعات (تكرار مع section) | Content |
| `*Section.tsx` (الكثير) | شاشات الأقسام | حسب الجدول أعلاه |
| `BulkImport*` / `ContentFileImport*` / `Phase2TrialImport*` / `AggregatorSection*` | استيراد/تجميع | Content / Automation |

---

## 6. مكوّنات عامة فوق التطبيق (FABs / Overlays)

| مكوّن | مسار | سلوك | قرار v3 |
|---|---|---|---|
| `AdminSiteEditBar` | `components/AdminSiteEditBar.tsx` · يُحمَّل من `App.tsx` | زر عائم «مشرف» + «تحرير الصفحة» | **حذف بعد الترحيل** (PR-12/13) |
| `AdminQuickEdit` | `components/AdminQuickEdit.tsx` | FAB تحرير على دروس/أحكام/حديث/معجزات/سيرة/قصص… | **حذف من السطح العام**؛ التحرير داخل Content Center |
| `AdminInlineEdit` | `components/AdminInlineEdit.tsx` | تعديل مضمّن للمشرفين | يُراجع؛ لا يبقى كـ FAB عام |
| `AdminRouteGuard` | `components/AdminRouteGuard.tsx` | حراسة المسارات | يُعاد استخدام المنطق دون تغيير صلاحيات |
| `SubmissionsReviewPanel` | `components/admin/` | لوحة مقترحات | Review Center |
| `components/admin/review-hub/*` (~12) | شل/شريط/مساحة عمل/Diff/صوت | Review Center |

**مداخل تنقّل عامة تشير للإدارة:**

- `NavBar` — تبويب/رابط عند `isAdmin`  
- `SideNavDrawer` — «لوحة التحكم» → `/admin`  
- `feature-registry` — `inSideNav: true`, `inBottomNav: false`  
- `BottomNavBar` — **لا** رابط admin (مؤكد)

---

## 7. مجموعات القدرات (Features)

### 7.1 Pages / CMS Content
دروس · مشايخ · مكتبة · فوائد · أذكار · إشارات · أسئلة · مسابقة · أحكام · دورات · دعوة · أيام الأسبوع · أربعون المحبة · أبحاث · قصص أنبياء/إسلامية · مستجدات · جامعات · تصنيفات · استيراد صورة/رابط · Smart CMS

### 7.2 Moderation / Review
`review-hub` · `review-center` / `automation/review` · submissions · reports · scholarly-verification · religious-calendar-review · طوابير داخل AKP/MKE

### 7.3 Users
`UsersSection` / `/admin/users` · أدوار عبر `governance-roles` / Auth `isAdmin`  
**فجوة v3:** Roles/Permissions/Activity/Suspensions/Audit كشاشات موحّدة غير مكتملة في shell الحالي

### 7.4 Notifications
Telegram section · شارات إشعار في MKE  
**فجوة:** لا مركز push-admin موحّد في الويب

### 7.5 Analytics / Reports
`search-analytics` · `feature-status` · إحصاءات dashboard · `ReportsSection` · `error-logs` · `/internal/status`

### 7.6 AI / Automation / CMS Automation
smart-cms · knowledge-engine · autonomous-ai · islamic-intelligence · knowledge-reasoning · verified-knowledge · global-reference · open-platform · auto-content · content-production · automation center/dashboard/platform/sources · aggregator · Instagram · lesson automation APIs

### 7.7 Settings / Governance
`SettingsSection` · `governance` · سياسات حوكمة مؤسسية

### 7.8 System
error-logs · feature-status · `/internal/status` · (Cache/Jobs/Storage موزّعة داخل منصات الأتمتة — تحتاج تجميع في System Center)

---

## 8. Services / Libs / API (لا تُمس منطق الأعمال في موجات UI)

### عميل (`artifacts/majalis/src/lib/`)
`admin-api.ts` · `admin-list-load.ts` · `admin-review-hub/*` · `adhkar-admin.ts` · `categories-admin-service.ts` · `learning-paths-admin-service.ts` · `lesson-automation-api.ts` · `lesson-import-api.ts` · `auto-content-service.ts` · `auto-content/*` · `smart-cms-api.ts` · `majlis-knowledge-engine-api.ts` · `instagram-integration-api.ts` · `governance-service.ts` · `governance-roles.ts` · `knowledge-engine-service.ts` · `cms/*` · خدمات AI/منصات مرتبطة أعلاه

### Supabase helpers
دوال `adminGet*` / `adminUpsert*` / `adminDelete*` في طبقة supabase للمشايخ/الدروس/المكتبة/…  
**قاعدة البرنامج:** لا تعديل CRUD/صلاحيات/بيانات في موجات البناء UI.

### API handlers (`artifacts/majalis/lib/api-handlers/admin/` — 32)
ai-agents · auth-context · auto-content · auto-knowledge-engine · autonomous-ai/platform · bootstrap-owner · check-fiqh-links · content-import/production · feature-health · global-reference · governance · instagram · islamic-intelligence · knowledge-pipeline/reasoning · lesson-automation/from-image/from-url · majlis-knowledge-engine · open-platform · platform-bootstrap · production-activate · scholarly-verification · search-analytics · smart-cms · source-monitor · submissions · sync-fiqh-council · telegram · verified-knowledge · …

### خادم مساعد
`lib/admin-auth.mjs` · `lib/supabase-admin.mjs`

---

## 9. أنماط CSS (Legacy UI)

| ملف | ملاحظة |
|---|---|
| `styles/admin.css` | عام |
| `styles/pages/admin-shell.css` | Drawer/Shell — **يُستبدل** |
| `styles/pages/admin-review-hub.css` | خانة المراجعة |
| `styles/pages/admin-categories.css` | تصنيفات |
| `styles/pages/fiqh-admin.css` | فقه |
| `styles/pages/prophet-stories-admin.css` | قصص |
| `styles/pages/universities-admin.css` | جامعات |
| `styles/components/admin-inline-edit.css` | تعديل مضمّن |
| `styles/admin-gate.css` / بوابة دخول | حراسة بصرية |

---

## 10. Expo Mobile Admin (موازي)

`artifacts/majalis-mobile/app/admin.tsx` + `components/admin/{Sheikhs,Lessons,Library,Miracles,Fawaid,Users,AdminFormModal}`  
**قرار:** خارج نطاق حذف ويب v3 في PR-13 ما لم يُقرر المالك توحيدًا لاحقًا؛ يُسجَّل كـ Legacy موازٍ.

---

## 11. مراكز مكررة (يجب دمجها في الترحيل)

| الهم | الأسطح المتنافسة |
|---|---|
| مراجعة | review-hub · review-center · submissions/reports/scholarly · طوابير AKP |
| قيادة / Dashboard | `/admin` dashboard · `/admin/dashboard` · Automation Center/Dashboard · Content Production · MKE · AKP |
| محتوى / CMS | أقسام Shell · Smart CMS · Auto-content · Image/URL import |
| معرفة / AI | knowledge-engine section · MKE platform · AKP · autonomous-ai / islamic-intelligence |
| جامعات | صفحة `/admin/universities` **و** `?section=universities` |
| Telegram | فرع مزدوج في AdminPage |

---

## 12. مصفوفة الترحيل → Admin v3 (PR-4…PR-11)

| Legacy | PR ترحيل مستهدف | مركز v3 |
|---|---|---|
| Dashboard / إحصاءات سريعة / نشاط | PR-4 | Home |
| كل أقسام المحتوى + استيراد + جامعات + قصص | PR-5 | Content |
| review-hub + review-center + submissions + scholarly + calendar + reports (طابور) | PR-6 | Review |
| users + governance أدوار (عرض) | PR-7 | Users |
| search-analytics + أجزاء feature-status/reports | PR-8 | Analytics |
| كل automation/AI/CMS/Instagram/aggregators | PR-9 | Automation |
| error-logs + feature-status + internal/status + مراقبة منصات | PR-10 | System |
| settings + governance سياسات | PR-11 | Settings |
| Telegram / إشعارات | PR-11 أو مركز Notifications ضمن Settings/More | Notifications |
| FABs العامة + AdminShell القديم | PR-12 Migration + PR-13 Delete | — |

---

## 13. ما يُحذف لاحقًا فقط (PR-13) — قائمة مرشحة

**لا يُحذف شيء في PR-1.** بعد نجاح الترحيل الكامل:

- `AdminShell` Drawer الأسود + `admin-shell.css`  
- مسارات aliases الميتة (`fiqh-review` / `fiqh-quality`) إن بقيت  
- `AdminSiteEditBar` · FABs `AdminQuickEdit` على السطح العام  
- صفحات/مراكز مكررة بعد توحيد الوجهة  
- أقسام Shell القديمة غير الموصولة بـ v3  

**ممنوع حتى الترحيل:** حذف Feature · تعديل بيانات · تعديل صلاحيات · تعديل CRUD/قواعد أعمال.

---

## 14. خطة الموجات (مرجع البرنامج)

| PR | نطاق |
|---|---|
| **PR-1** | هذا الجرد ✓ |
| PR-2 | Admin Design System (Ivory / Emerald / Gold) |
| PR-3 | Admin Shell (Mobile First + Bottom Nav 5) |
| PR-4 | Dashboard / Home |
| PR-5 | Content Center |
| PR-6 | Review Center |
| PR-7 | Users |
| PR-8 | Analytics |
| PR-9 | Automation |
| PR-10 | System |
| PR-11 | Settings (+ Notifications grouping) |
| PR-12 | Migration (تحويل المسارات/الروابط) |
| PR-13 | Delete Legacy Admin |

كل PR من أحدث `main` · لا تبدأ التالية قبل دمج الحالية.

---

## 15. معايير قبول الجرد (PR-1)

- [x] جرد الصفحات والمسارات والأقسام  
- [x] جرد المراجعات/CMS/AI/أتمتة/تحليلات/مستخدمين/إعدادات  
- [x] جرد FABs والـDrawer  
- [x] مصفوفة ترحيل إلى مراكز v3 التسعة  
- [x] قائمة مرشحة للحذف **مؤجّلة**  
- [x] لا تغيير كود منتج إداري في هذه الموجة  

---

## 16. Owner Actions

1. اعتماد هذا الجرد كخط أساس قبل PR-2.  
2. تأكيد هل Expo `admin.tsx` يدخل نفس برنامج الحذف أم مسار منفصل.  
3. تأكيد أولوية Notifications كمركز مستقل في More أم تحت Settings.  
4. لا SQL مستضاف · لا تغيير RLS في موجات UI.  
5. لا تعديل نسخة App Store تلقائيًا.
