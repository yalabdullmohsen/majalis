# تقرير نظام تواصل — Majlis Ilm

## 1. الصفحات الجديدة

| المسار | الوصف |
|---|---|
| `/contact-chat` | واجهة الدردشة الداخلية للمستخدم والزائر |
| `/admin/contact-chat` | لوحة إدارة المحادثات (ضمن AdminPage) |
| `/contact` | صفحة تعريفية مختصرة + زر «ابدأ محادثة» (النموذج القديم `/api/contact` ما زال موجوداً في `/admin/contact-messages`) |

## 2. الجداول الجديدة (Supabase)

ملف: `supabase/contact_chat_v1.sql`

- `contact_threads` — المحادثات (حالة، أولوية، سياق الصفحة، unread)
- `contact_messages` — الرسائل (user/admin/system، is_internal)
- `contact_attachments` — مرفقات (base64 أو storage_path)
- `contact_thread_events` — سجل تدقيق الأحداث
- `contact_internal_notes` — ملاحظات داخلية للإدارة فقط

تطبيق Migration:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=contact-chat"
```

## 3. APIs الجديدة

Endpoint: `/api/contact-chat`

| action | الوصف |
|---|---|
| `create_thread` | إنشاء محادثة + رسالة أولى |
| `threads` | قائمة محادثات المستخدم أو الزائر (token) |
| `admin_threads` | كل المحادثات للإدارة + فلاتر |
| `messages` | رسائل محادثة (يخفي is_internal عن المستخدم) |
| `send` | رسالة من المستخدم/الزائر |
| `admin_reply` | رد الإدارة |
| `user_update_thread` | إغلاق/إعادة فتح من المستخدم |
| `update_thread` | تحديث حالة/أولوية/إسناد (إدارة) |
| `delete_thread` | حذف نهائي (إدارة) |
| `internal_note` | ملاحظة داخلية |
| `unread` | عدد غير المقروء (user/admin) |

## 4. أين يظهر زر «تواصل»

- القائمة الرئيسية (`PRIMARY_NAV`)
- قائمة الجوال (`MOBILE_MORE_NAV`)
- Footer (`SiteFooter`)
- صفحة عن المنصة (`AboutPage`)
- لوحة التحكم (`AdminShell` → «تواصل — الدردشة»)
- زر عائم أسفل يسار الموقع (`ContactChatFloatingButton`)
- Error Boundary → «إبلاغ عن المشكلة»
- صفحة 404 → «إبلاغ عن مشكلة»
- تفاصيل: دروس، أبحاث، حلقات، سؤال وجواب (`ContactChatReportButton`)
- صحة المنصة → روابط إدارة الدردشة

## 5. الدردشة للزائر

1. يفتح `/contact-chat` أو يضغط الزر العائم.
2. يختار نوع الرسالة ويكتب رسالته (اسم/بريد اختياريان).
3. يُنشأ `access_token` + رابط تتبع `?thread=…&token=…`.
4. يُحفظ الرابط في localStorage للمتابعة لاحقاً.
5. يتابع الردود داخل نفس الصفحة دون تسجيل.
6. يُشجَّع على `/register` لحفظ المحادثات على الأجهزة.

## 6. الدردشة للمستخدم المسجل

- المحادثة تُربط بـ `user_id` تلقائياً.
- يرى كل محادثاته في الشريط الجانبي.
- شارة «تواصل» في NavBar عند وجود ردود غير مقروءة.
- يمكنه إغلاق المحادثة وإعادة فتحها.
- إشعار داخل التطبيق عند رد الإدارة (جدول `notifications`).

## 7. رد الإدارة

1. `/admin/contact-chat`
2. فلترة: حالة، نوع، أولوية، بحث
3. اختيار محادثة → قراءة السياق (صفحة، ضيف، بريد)
4. رد سريع، تغيير حالة/أولوية، أرشفة، حذف
5. ملاحظات داخلية لا يراها المستخدم
6. سجل أحداث في `contact_thread_events`

## 8. الإشعارات

- **المستخدم:** `notifications` عند `admin_reply` + شارة NavBar (`ContactChatUnreadBadge`)
- **الإدارة:** عداد غير مقروء في شريط أدوات ContactChatSection + `NotificationBell` للمسؤولين
- **Polling:** تحديث الرسائل كل 15 ثانية في واجهة المستخدم

## 9. نتائج الاختبارات

```bash
pnpm --filter @workspace/majalis run verify:contact-chat
# 22/22 PASS

PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
# PASS
```

اختبارات API (memory fallback):
- زائر ينشئ محادثة ✓
- قائمة بالـ token ✓
- إرسال رسالة ✓
- إغلاق وإعادة فتح ✓
- عزل token غير صالح ✓

## 10. قيود ومتطلبات إنتاجية

| البند | الحالة |
|---|---|
| تطبيق SQL على Supabase | **مطلوب** (`scope=contact-chat`) |
| `SUPABASE_SERVICE_ROLE_KEY` | مطلوب للكتابة عبر API |
| Redis rate limit (Upstash) | موصى به في الإنتاج |
| المرفقات | base64 في DB (~400KB/client، 512KB/server) — Supabase Storage لاحقاً |
| Realtime | polling 15s — Supabase Realtime اختياري |
| إسناد لمشرف | حقل `assigned_to` جاهز — واجهة اختيار المشرف لاحقاً |
| RLS | service-role policies — الوصول عبر API فقط |

## الملفات الرئيسية

```
supabase/contact_chat_v1.sql
lib/api-handlers/contact-chat.js
src/views/ContactChatPage.tsx
src/views/admin/ContactChatSection.tsx
src/components/ContactChatFloatingButton.tsx
src/components/ContactChatReportButton.tsx
src/components/ContactChatUnreadBadge.tsx
src/lib/contact-chat.ts
scripts/verify-contact-chat.mjs
```
